import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // ------------------------------------------------------------------
    // 1. Autenticação
    // ------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    let userId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
        userId = decoded.userId;
    } catch(e) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Recebe qual moeda o usuário QUER usar (currency: 'LITE' | 'PREMIUM')
    const { chapterId, type, currency } = await req.json(); 

    if (!['RENTAL', 'PERMANENT'].includes(type)) {
        return NextResponse.json({ error: "Tipo de desbloqueio inválido" }, { status: 400 });
    }

    // ------------------------------------------------------------------
    // 2. Buscar Dados
    // ------------------------------------------------------------------
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    
    // Precisamos buscar os lotes de Lite Coins válidos se a escolha for LITE
    const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { 
            liteCoinBatches: {
                where: { expiresAt: { gt: new Date() }, amount: { gt: 0 } }, // Apenas válidos e com saldo
                orderBy: { expiresAt: 'asc' } // Usar os que vencem logo primeiro
            } 
        } 
    });

    if (!chapter || !user) return NextResponse.json({ error: "Dados inválidos" }, { status: 404 });

    // Verificar se já possui desbloqueio
    const existingUnlock = await prisma.unlock.findUnique({
        where: { userId_chapterId: { userId, chapterId } }
    });

    if (existingUnlock) {
        if (existingUnlock.type === 'PERMANENT') {
            return NextResponse.json({ success: true, message: "Já possui permanente" });
        }
        // Se já tem aluguel ativo, estende ou ignora? 
        // Aqui assumimos que se ele clicou em comprar de novo, ele quer renovar ou comprar permanentemente.
    }

    // ------------------------------------------------------------------
    // 3. Regras de Preço e Saldo
    // ------------------------------------------------------------------
    let cost = 0;
    const dbOperations: any[] = []; // Array para guardar as operações da transação do Prisma

    // --- CASO 1: Compra Permanente (Obrigatoriamente Premium) ---
    if (type === 'PERMANENT') {
        if (currency === 'LITE') {
            return NextResponse.json({ error: "Moedas Lite servem apenas para aluguel." }, { status: 400 });
        }
        cost = chapter.pricePremium;

        if (user.balancePremium < cost) {
            return NextResponse.json({ error: "Saldo Premium insuficiente." }, { status: 402 });
        }

        // Operação: Debitar Premium
        dbOperations.push(
            prisma.user.update({
                where: { id: userId },
                data: { balancePremium: { decrement: cost } }
            })
        );
    } 
    
    // --- CASO 2: Aluguel (Pode ser Lite ou Premium) ---
    else {
        cost = chapter.priceLite;

        if (currency === 'PREMIUM') {
            // Usuário escolheu gastar Premium para alugar
            if (user.balancePremium < cost) {
                return NextResponse.json({ error: "Saldo Premium insuficiente." }, { status: 402 });
            }
            dbOperations.push(
                prisma.user.update({
                    where: { id: userId },
                    data: { balancePremium: { decrement: cost } }
                })
            );

        } else {
            // Usuário escolheu gastar LITE
            // 1. Calcular saldo total de Lite disponível
            const totalLite = user.liteCoinBatches.reduce((acc, batch) => acc + batch.amount, 0);

            if (totalLite < cost) {
                return NextResponse.json({ error: "Saldo Lite insuficiente. Use Premium ou compre mais." }, { status: 402 });
            }

            // 2. Lógica de Consumo de Lotes (Burn Logic)
            let remainingCost = cost;
            
            for (const batch of user.liteCoinBatches) {
                if (remainingCost <= 0) break;

                const deduction = Math.min(batch.amount, remainingCost); // Tira o que der deste lote
                
                // Operação: Atualizar ou Deletar o lote
                if (batch.amount - deduction === 0) {
                    // Se zerou o lote, deletamos para limpar o banco (opcional, pode só setar 0)
                    dbOperations.push(
                        prisma.liteCoinBatch.delete({ where: { id: batch.id } })
                    );
                } else {
                    dbOperations.push(
                        prisma.liteCoinBatch.update({
                            where: { id: batch.id },
                            data: { amount: { decrement: deduction } }
                        })
                    );
                }

                remainingCost -= deduction;
            }
        }
    }

    // ------------------------------------------------------------------
    // 4. Finalizar Transação (Log + Unlock)
    // ------------------------------------------------------------------
    
    // Operação: Criar Log de Transação
    dbOperations.push(
        prisma.transaction.create({
            data: {
                userId,
                amount: -cost,
                currency: currency === 'PREMIUM' ? 'PREMIUM' : 'LITE',
                type: 'SPEND',
                description: `${type === 'PERMANENT' ? 'Compra' : 'Aluguel'} Cap. ${chapter.order} - ${chapter.title}`
            }
        })
    );

    // Operação: Criar ou Atualizar o Unlock
    const expiresAt = type === 'RENTAL' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null; // 3 dias

    dbOperations.push(
        prisma.unlock.upsert({
            where: { userId_chapterId: { userId, chapterId } },
            create: {
                userId,
                chapterId,
                type: type,
                expiresAt
            },
            update: {
                type: type,
                expiresAt // Se já existia, renova o prazo ou vira permanente
            }
        })
    );

    // Executa tudo junto
    await prisma.$transaction(dbOperations);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro no Unlock:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
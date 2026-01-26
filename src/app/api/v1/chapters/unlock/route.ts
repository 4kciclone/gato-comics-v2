import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // 1. Autenticação
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

    const { chapterId, type, currency } = await req.json(); 

    if (!['RENTAL', 'PERMANENT'].includes(type)) {
        return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    // 2. Iniciar Transação do Banco (Atomicidade)
    // Usamos $transaction interativa para garantir leituras e escritas consistentes
    const result = await prisma.$transaction(async (tx) => {
        
        // A. Buscar Dados Atualizados
        const chapter = await tx.chapter.findUnique({ where: { id: chapterId } });
        const user = await tx.user.findUnique({ 
            where: { id: userId },
            include: { 
                liteCoinBatches: {
                    where: { expiresAt: { gt: new Date() }, amount: { gt: 0 } },
                    orderBy: { expiresAt: 'asc' } // Consome os que vencem primeiro (FIFO)
                } 
            } 
        });

        if (!chapter || !user) throw new Error("Dados não encontrados");

        // B. Verificar se já tem acesso
        const existingUnlock = await tx.unlock.findUnique({
            where: { userId_chapterId: { userId, chapterId } }
        });

        // Se já tem permanente, não cobra de novo
        if (existingUnlock?.type === 'PERMANENT') {
             return { success: true, message: "Já adquirido" };
        }

        let cost = 0;
        let currencyUsed = 'LITE';

        // C. Lógica de Cobrança
        if (type === 'PERMANENT') {
            if (currency === 'LITE') throw new Error("Moedas Lite não compram acesso permanente.");
            
            cost = chapter.pricePremium;
            if (user.balancePremium < cost) throw new Error("Saldo Premium insuficiente.");

            await tx.user.update({
                where: { id: userId },
                data: { balancePremium: { decrement: cost } }
            });
            currencyUsed = 'PREMIUM';

        } else { // RENTAL
            cost = chapter.priceLite;

            if (currency === 'PREMIUM') {
                if (user.balancePremium < cost) throw new Error("Saldo Premium insuficiente.");
                await tx.user.update({
                    where: { id: userId },
                    data: { balancePremium: { decrement: cost } }
                });
                currencyUsed = 'PREMIUM';
            } else {
                // Gastar Lite (FIFO)
                const totalLite = user.liteCoinBatches.reduce((acc, b) => acc + b.amount, 0);
                if (totalLite < cost) throw new Error("Saldo Lite insuficiente.");

                let remainingCost = cost;
                for (const batch of user.liteCoinBatches) {
                    if (remainingCost <= 0) break;
                    
                    const deduction = Math.min(batch.amount, remainingCost);
                    
                    if (batch.amount - deduction === 0) {
                        await tx.liteCoinBatch.delete({ where: { id: batch.id } });
                    } else {
                        await tx.liteCoinBatch.update({
                            where: { id: batch.id },
                            data: { amount: { decrement: deduction } }
                        });
                    }
                    remainingCost -= deduction;
                }
                currencyUsed = 'LITE';
            }
        }

        // D. Registrar Transação
        await tx.transaction.create({
            data: {
                userId,
                amount: -cost,
                currency: currencyUsed as any,
                type: 'SPEND',
                description: `${type === 'PERMANENT' ? 'Compra' : 'Aluguel'} Cap. ${chapter.order}`
            }
        });

        // E. Criar/Atualizar Unlock
        const expiresAt = type === 'RENTAL' ? new Date(Date.now() + 72 * 60 * 60 * 1000) : null; // 72 horas

        await tx.unlock.upsert({
            where: { userId_chapterId: { userId, chapterId } },
            create: { userId, chapterId, type, expiresAt },
            update: { type, expiresAt }
        });

        return { success: true };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Erro unlock:", error.message);
    const status = error.message.includes("insuficiente") ? 402 : 500;
    return NextResponse.json({ error: error.message || "Erro interno" }, { status });
  }
}
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { revalidatePath } from "next/cache";

type EntitlementState = { error?: string; success?: string; } | null;

/**
 * Vincula ou desvincula uma obra a um slot de assinatura do usuário.
 */
export async function manageWorkEntitlement(
    prevState: EntitlementState, 
    formData: FormData
): Promise<EntitlementState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Login necessário." };
    }

    const workId = formData.get("workId") as string;
    const action = formData.get("action") as "ADD" | "REMOVE";

    if (!workId || !action) {
        return { error: "Ação inválida." };
    }

    try {
        // Selecionamos apenas os campos necessários para validação
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                subscriptionTier: true,
                subscriptionValidUntil: true, // Importante para checar validade
                entitlementChangeUntil: true, // Janela de troca
                _count: { 
                    select: { workEntitlements: true } 
                }
            }
        });

        // 1. Verifica se tem assinatura
        if (!user || !user.subscriptionTier) {
            return { error: "Você não possui uma assinatura ativa." };
        }

        // 2. Verifica se a assinatura não expirou
        if (user.subscriptionValidUntil && new Date(user.subscriptionValidUntil) < new Date()) {
            return { error: "Sua assinatura expirou. Renove para gerenciar obras." };
        }

        // Busca as regras do plano
        const planKey = `sub_${user.subscriptionTier.toLowerCase()}`;
        // @ts-ignore - Caso o tier no banco não bata exatamente com a config (segurança de tipo)
        const plan = SUBSCRIPTION_PLANS[planKey];
        
        if (!plan) return { error: "Erro na configuração do plano." };

        // --- AÇÃO: ADICIONAR ---
        if (action === "ADD") {
            // Verifica limite de slots
            if (user._count.workEntitlements >= plan.works) {
                return { error: `Limite atingido! Seu plano permite apenas ${plan.works} obras.` };
            }

            await prisma.workEntitlement.create({
                data: { userId: user.id, workId }
            });
            
            revalidatePath("/profile/subscription");
            return { success: "Obra vinculada com sucesso!" };
        } 
        
        // --- AÇÃO: REMOVER ---
        else if (action === "REMOVE") {
            // Verifica janela de troca (7 dias)
            // Se a data for nula ou já tiver passado, bloqueia a remoção
            if (!user.entitlementChangeUntil || new Date(user.entitlementChangeUntil) < new Date()) {
                return { error: "A janela de troca fechou. Você só poderá remover obras na próxima renovação." };
            }

            await prisma.workEntitlement.delete({
                where: { userId_workId: { userId: user.id, workId } }
            });
            
            revalidatePath("/profile/subscription");
            return { success: "Obra removida. O slot foi liberado." };
        }

        return { error: "Ação desconhecida." };

    } catch (error) {
        console.error("Erro ao gerenciar vínculo:", error);
        
        // Tratamento específico do Prisma para duplicidade
        if ((error as any).code === 'P2002') {
            return { error: "Esta obra já está vinculada à sua conta." };
        }
        
        return { error: "Ocorreu um erro ao processar sua solicitação." };
    }
}
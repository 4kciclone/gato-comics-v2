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
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { _count: { select: { workEntitlements: true } } }
        });

        if (!user || !user.subscriptionTier) {
            return { error: "Você não possui uma assinatura ativa." };
        }

        // Busca as regras do plano atual do usuário
        const planKey = `sub_${user.subscriptionTier.toLowerCase()}`;
        const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];

        if (action === "ADD") {
            // Verifica se o usuário ainda tem slots disponíveis
            if (user._count.workEntitlements >= plan.works) {
                return { error: "Você atingiu o limite de obras para o seu plano." };
            }

            // Cria o vínculo
            await prisma.workEntitlement.create({
                data: { userId: user.id, workId }
            });
            
            revalidatePath("/profile/subscription");
            return { success: "Obra vinculada com sucesso!" };

        } else if (action === "REMOVE") {
            // Verifica se o usuário está dentro da janela de 7 dias para troca
            if (user.entitlementChangeUntil && user.entitlementChangeUntil < new Date()) {
                return { error: "A janela de 7 dias para trocar obras já encerrou. Aguarde a próxima renovação." };
            }

            // Remove o vínculo
            await prisma.workEntitlement.delete({
                where: { userId_workId: { userId: user.id, workId } }
            });
            
            revalidatePath("/profile/subscription");
            return { success: "Obra desvinculada com sucesso!" };
        }

        return { error: "Ação desconhecida." };
    } catch (error) {
        console.error("Erro ao gerenciar vínculo de obra:", error);
        // Pode ser um erro de 'unique constraint' se tentar adicionar duas vezes
        if ((error as any).code === 'P2002') {
            return { error: "Esta obra já está vinculada." };
        }
        return { error: "Ocorreu um erro." };
    }
}
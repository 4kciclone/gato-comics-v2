"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { revalidatePath } from "next/cache";

type EntitlementState = { error?: string; success?: string; } | null;

export async function manageWorkEntitlement(
    prevState: EntitlementState, 
    formData: FormData
): Promise<EntitlementState> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Login necessário." };

    const workId = formData.get("workId") as string;
    const action = formData.get("action") as "ADD"; // Removemos "REMOVE" do tipo

    if (!workId || action !== "ADD") {
        return { error: "Ação inválida." };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                subscriptionTier: true,
                subscriptionValidUntil: true,
                _count: { select: { workEntitlements: true } }
            }
        });

        if (!user || !user.subscriptionTier) return { error: "Sem assinatura ativa." };

        if (user.subscriptionValidUntil && new Date(user.subscriptionValidUntil) < new Date()) {
            return { error: "Sua assinatura expirou." };
        }

        const planKey = `sub_${user.subscriptionTier.toLowerCase()}`;
        // @ts-ignore
        const plan = SUBSCRIPTION_PLANS[planKey];
        
        if (!plan) return { error: "Erro no plano." };

        // --- AÇÃO: ADICIONAR (TRAVAR SLOT) ---
        // Verifica se tem espaço
        if (user._count.workEntitlements >= plan.works) {
            return { error: `Todos os seus ${plan.works} slots estão ocupados.` };
        }

        await prisma.workEntitlement.create({
            data: { userId: session.user.id, workId }
        });
        
        revalidatePath("/profile/subscription");
        return { success: "Obra desbloqueada e slot travado até a renovação!" };

    } catch (error) {
        if ((error as any).code === 'P2002') {
            return { error: "Você já desbloqueou esta obra." };
        }
        return { error: "Erro ao processar." };
    }
}
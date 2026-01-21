"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Configurações
const DAILY_REWARD_AMOUNT = 1;
const AD_REWARD_AMOUNT = 1;
const MAX_ADS_PER_DAY = 5;
const LITE_COIN_EXPIRATION_DAYS = 7; // Validade das Patinhas Lite

// --- Action para obter o status atual das recompensas ---
export async function getRewardStatus() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Não autenticado", dailyClaimed: true, adsWatched: MAX_ADS_PER_DAY };
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera para o início do dia

    const [dailyClaim, adCount] = await Promise.all([
        prisma.transaction.findFirst({
            where: { userId, type: "EARN", description: "Check-in Diário", createdAt: { gte: today } },
        }),
        prisma.transaction.count({
            where: { userId, type: "EARN", description: "Anúncio Assistido", createdAt: { gte: today } },
        })
    ]);

    return {
        dailyClaimed: !!dailyClaim,
        adsWatched: adCount
    };
}


// --- Action para resgatar a recompensa diária ---
export async function claimDailyReward() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingClaim = await prisma.transaction.findFirst({
    where: { userId, type: "EARN", description: "Check-in Diário", createdAt: { gte: today } },
  });

  if (existingClaim) {
    return { error: "Você já fez seu check-in hoje. Volte amanhã!" };
  }
  
  // Cria um novo lote de Patinhas Lite que expira em 7 dias
  await prisma.liteCoinBatch.create({
      data: {
          userId,
          amount: DAILY_REWARD_AMOUNT,
          expiresAt: new Date(Date.now() + LITE_COIN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
      }
  });

  // Mantém o registro da transação para o extrato do usuário
  await prisma.transaction.create({
      data: {
        userId,
        amount: DAILY_REWARD_AMOUNT,
        currency: "LITE",
        type: "EARN",
        description: "Check-in Diário",
      },
  });

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true, amount: DAILY_REWARD_AMOUNT };
}


// --- Action para ganhar recompensa assistindo a um "anúncio" ---
export async function watchAdReward() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const adCount = await prisma.transaction.count({
    where: { userId, type: "EARN", description: "Anúncio Assistido", createdAt: { gte: today } },
  });

  if (adCount >= MAX_ADS_PER_DAY) {
    return { error: "Limite de anúncios diários atingido (5/5)." };
  }
  
  // Cria um novo lote de Patinhas Lite que expira em 7 dias
  await prisma.liteCoinBatch.create({
      data: {
          userId,
          amount: AD_REWARD_AMOUNT,
          expiresAt: new Date(Date.now() + LITE_COIN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
      }
  });

  // Registra a transação no extrato
  await prisma.transaction.create({
      data: {
        userId,
        amount: AD_REWARD_AMOUNT,
        currency: "LITE",
        type: "EARN",
        description: "Anúncio Assistido",
      },
  });

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true, amount: AD_REWARD_AMOUNT, remaining: MAX_ADS_PER_DAY - (adCount + 1) };
}

export async function redeemCode(code: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Faça login para resgatar." };

  const userId = session.user.id;
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) return { error: "Código inválido." };

  try {
    const promo = await prisma.promoCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!promo || !promo.isActive) return { error: "Código inválido ou inativo." };
    if (promo.expiresAt && new Date() > promo.expiresAt) return { error: "Este código expirou." };
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return { error: "Este código esgotou." };

    const used = await prisma.promoCodeRedemption.findUnique({
      where: { codeId_userId: { codeId: promo.id, userId } }
    });

    if (used) return { error: "Você já resgatou este código." };

    // CORREÇÃO AQUI: Tipagem do array de transação
    const transactionOperations: any[] = [
      prisma.promoCodeRedemption.create({
        data: { codeId: promo.id, userId }
      }),
      prisma.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: promo.amount,
          currency: promo.type,
          type: "BONUS",
          description: `Código: ${promo.code}`
        }
      })
    ];

    if (promo.type === "PREMIUM") {
        transactionOperations.push(
            prisma.user.update({
              where: { id: userId },
              data: { balancePremium: { increment: promo.amount } }
            })
        );
    } else {
        transactionOperations.push(
            prisma.liteCoinBatch.create({
              data: {
                userId,
                amount: promo.amount,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              }
            })
        );
    }

    await prisma.$transaction(transactionOperations);

    return { 
        success: true, 
        amount: promo.amount, 
        type: promo.type === "PREMIUM" ? "Premium" : "Lite" 
    };

  } catch (error) {
    console.error(error);
    return { error: "Erro ao processar resgate." };
  }
}
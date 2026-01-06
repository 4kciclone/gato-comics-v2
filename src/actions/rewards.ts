"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Configurações
const DAILY_REWARD_AMOUNT = 5;
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
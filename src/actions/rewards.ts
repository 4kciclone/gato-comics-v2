"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Configurações
const DAILY_REWARD_AMOUNT = 5;
const AD_REWARD_AMOUNT = 1;
const MAX_ADS_PER_DAY = 5;

export async function claimDailyReward() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zera hora para comparar dia

  // 1. Verifica se já pegou hoje
  // Buscamos se existe alguma transação de 'EARN' do tipo 'DAILY' hoje
  const existingClaim = await prisma.transaction.findFirst({
    where: {
      userId,
      type: "EARN",
      description: "Check-in Diário",
      createdAt: {
        gte: today, // Maior ou igual a hoje 00:00
      },
    },
  });

  if (existingClaim) {
    return { error: "Você já fez seu check-in hoje. Volte amanhã!" };
  }

  // 2. Entrega a recompensa
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balanceLite: { increment: DAILY_REWARD_AMOUNT } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        amount: DAILY_REWARD_AMOUNT,
        currency: "LITE",
        type: "EARN",
        description: "Check-in Diário",
      },
    }),
  ]);

  revalidatePath("/"); // Atualiza saldo na UI
  return { success: true, amount: DAILY_REWARD_AMOUNT };
}

export async function watchAdReward() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Verifica limite de Ads diários
  const adCount = await prisma.transaction.count({
    where: {
      userId,
      type: "EARN",
      description: "Anúncio Assistido",
      createdAt: { gte: today },
    },
  });

  if (adCount >= MAX_ADS_PER_DAY) {
    return { error: "Limite de anúncios diários atingido (5/5)." };
  }

  // 2. Entrega recompensa
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balanceLite: { increment: AD_REWARD_AMOUNT } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        amount: AD_REWARD_AMOUNT,
        currency: "LITE",
        type: "EARN",
        description: "Anúncio Assistido",
      },
    }),
  ]);

  revalidatePath("/");
  return { success: true, amount: AD_REWARD_AMOUNT, remaining: MAX_ADS_PER_DAY - (adCount + 1) };
}
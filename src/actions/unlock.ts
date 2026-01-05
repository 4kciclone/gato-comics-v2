"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type UnlockState = {
  message?: string;
  error?: string;
  success?: boolean;
} | null;

export async function unlockChapter(
  prevState: UnlockState,
  formData: FormData
): Promise<UnlockState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado." };
  }

  const userId = session.user.id;
  const chapterId = formData.get("chapterId") as string;
  const workSlug = formData.get("workSlug") as string;
  const chapterSlug = formData.get("chapterSlug") as string;
  const type = formData.get("type") as "RENTAL" | "PERMANENT";

  if (!chapterId || !type || !workSlug || !chapterSlug) {
    return { error: "Dados invalidos." };
  }

  try {
    const [chapter, user, existingUnlock] = await Promise.all([
      prisma.chapter.findUnique({ where: { id: chapterId }, select: { priceLite: true, pricePremium: true, title: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { balanceLite: true, balancePremium: true } }),
      prisma.unlock.findUnique({ where: { userId_chapterId: { userId, chapterId } } })
    ]);

    if (!chapter || !user) return { error: "Erro ao buscar dados." };

    if (existingUnlock) {
      if (existingUnlock.type === 'RENTAL' && existingUnlock.expiresAt && existingUnlock.expiresAt < new Date()) {
        // Deixa o código continuar para a transação.
      } else {
        return { success: true };
      }
    }

    let cost = 0;
    let currencyField: "balanceLite" | "balancePremium";
    let currency: "LITE" | "PREMIUM"; // <-- CORREÇÃO: Variável definida aqui

    if (type === "RENTAL") {
      cost = chapter.priceLite;
      currencyField = "balanceLite";
      currency = "LITE";
    } else {
      cost = chapter.pricePremium;
      currencyField = "balancePremium";
      currency = "PREMIUM";
    }

    if (user[currencyField] < cost) {
      return { error: `Saldo de Patinhas ${currency === 'LITE' ? 'Lite' : 'Premium'} insuficiente.` };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          [currencyField]: { decrement: cost },
          ...(!existingUnlock && { xp: { increment: 10 } })
        }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: -cost,
          currency: currency,
          type: "SPEND",
          description: `${type === "RENTAL" ? "Aluguel" : "Compra"}: ${chapter.title}`,
          metadata: { chapterId }
        }
      }),
      prisma.unlock.upsert({
        where: { userId_chapterId: { userId, chapterId } },
        create: {
          userId,
          chapterId,
          type: type,
          expiresAt: type === "RENTAL" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null
        },
        update: {
          type: type,
          expiresAt: type === "RENTAL" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null
        }
      })
    ]);

    revalidatePath(`/ler/${workSlug}/${chapterSlug}`);
    revalidatePath(`/profile`);
    return { success: true };

  } catch (error) {
    console.error("Unlock Error:", error);
    return { error: "Erro ao processar desbloqueio." };
  }
}
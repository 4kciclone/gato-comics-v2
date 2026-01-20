"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// 1. Importe o tipo Prisma para tipagem
import { Prisma } from "@prisma/client"; 

export async function unlockChapter(chapterId: string, method: "LITE" | "PREMIUM") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  const userId = session.user.id;

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { priceLite: true, pricePremium: true, work: { select: { slug: true } }, slug: true }
    });

    if (!chapter) return { error: "Capítulo não encontrado." };

    // --- LÓGICA PREMIUM ---
    if (method === "PREMIUM") {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { balancePremium: true } });
      
      if (!user || user.balancePremium < chapter.pricePremium) {
        return { error: "Saldo Premium insuficiente." };
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { balancePremium: { decrement: chapter.pricePremium } }
        }),
        prisma.unlock.create({
          data: {
            userId,
            chapterId,
            type: "PERMANENT",
            expiresAt: null
          }
        }),
        prisma.transaction.create({
          data: {
            userId,
            amount: -chapter.pricePremium,
            currency: "PREMIUM",
            type: "SPEND",
            description: `Desbloqueio Cap. ${chapter.slug}`
          }
        })
      ]);
    }

    // --- LÓGICA LITE ---
    if (method === "LITE") {
      const batches = await prisma.liteCoinBatch.findMany({
        where: { userId, expiresAt: { gt: new Date() }, amount: { gt: 0 } },
        orderBy: { expiresAt: 'asc' }
      });

      const totalLite = batches.reduce((acc, b) => acc + b.amount, 0);
      if (totalLite < chapter.priceLite) {
        return { error: "Saldo Lite insuficiente." };
      }

      let remainingCost = chapter.priceLite;
      
      // 2. CORREÇÃO AQUI: Tipagem explícita do array
      const updates: Prisma.PrismaPromise<any>[] = [];

      for (const batch of batches) {
        if (remainingCost <= 0) break;

        const deduct = Math.min(batch.amount, remainingCost);
        
        // Agora o push funciona porque o array aceita Promises do Prisma
        updates.push(
          prisma.liteCoinBatch.update({
            where: { id: batch.id },
            data: { amount: { decrement: deduct } }
          })
        );
        remainingCost -= deduct;
      }

      await prisma.$transaction([
        ...updates,
        prisma.unlock.create({
          data: {
            userId,
            chapterId,
            type: "RENTAL",
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) 
          }
        }),
        prisma.transaction.create({
          data: {
            userId,
            amount: -chapter.priceLite,
            currency: "LITE",
            type: "SPEND",
            description: `Aluguel Cap. ${chapter.slug}`
          }
        })
      ]);
    }

    revalidatePath(`/ler/${chapter.work.slug}/${chapter.slug}`);
    return { success: true };

  } catch (error) {
    console.error(error);
    return { error: "Erro ao processar compra." };
  }
}
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
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { priceLite: true, pricePremium: true, title: true }
    });

    if (!chapter) return { error: "Capitulo nao encontrado." };

    const existingUnlock = await prisma.unlock.findUnique({
      where: { userId_chapterId: { userId, chapterId } }
    });
    
    // Proteção para não comprar/alugar novamente se já tiver acesso
    if (existingUnlock && !(existingUnlock.type === 'RENTAL' && existingUnlock.expiresAt && existingUnlock.expiresAt < new Date())) {
        return { success: true };
    }

    if (type === "RENTAL") { // --- LÓGICA PARA PATINHAS LITE (FIFO) ---
      const cost = chapter.priceLite;
      
      const validBatches = await prisma.liteCoinBatch.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'asc' },
      });

      const totalLiteBalance = validBatches.reduce((sum, batch) => sum + batch.amount, 0);

      if (totalLiteBalance < cost) {
        return { error: `Saldo de Patinhas Lite insuficiente. Voce tem ${totalLiteBalance}, precisa de ${cost}.` };
      }

      let costRemaining = cost;
      const updates: any[] = [];
      const deletions: string[] = [];

      for (const batch of validBatches) {
        if (costRemaining <= 0) break;
        if (batch.amount > costRemaining) {
          updates.push(prisma.liteCoinBatch.update({ where: { id: batch.id }, data: { amount: { decrement: costRemaining } } }));
          costRemaining = 0;
        } else {
          costRemaining -= batch.amount;
          deletions.push(batch.id);
        }
      }
      
      await prisma.$transaction([
        ...updates,
        prisma.liteCoinBatch.deleteMany({ where: { id: { in: deletions } } }),
        prisma.transaction.create({ data: { userId, amount: -cost, currency: 'LITE', type: "SPEND", description: `Aluguel: ${chapter.title}` } }),
        prisma.unlock.upsert({ 
            where: { userId_chapterId: { userId, chapterId } },
            create: { userId, chapterId, type: 'RENTAL', expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) },
            update: { type: 'RENTAL', expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) }
        }),
        prisma.user.update({ where: { id: userId }, data: { xp: { increment: existingUnlock ? 0 : 10 } } })
      ]);

    } else { // --- LÓGICA PARA PATINHAS PREMIUM (SIMPLES) ---
      const cost = chapter.pricePremium;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { balancePremium: true }});

      if (!user || user.balancePremium < cost) {
        return { error: `Saldo de Patinhas Premium insuficiente.` };
      }

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { balancePremium: { decrement: cost }, xp: { increment: existingUnlock ? 0 : 10 } } }),
        prisma.transaction.create({ data: { userId, amount: -cost, currency: 'PREMIUM', type: "SPEND", description: `Compra: ${chapter.title}` } }),
        prisma.unlock.upsert({ 
            where: { userId_chapterId: { userId, chapterId } },
            create: { userId, chapterId, type: 'PERMANENT' },
            update: { type: 'PERMANENT', expiresAt: null }
        })
      ]);
    }

    revalidatePath(`/ler/${workSlug}/${chapterSlug}`);
    revalidatePath(`/profile`);
    return { success: true };

  } catch (error) {
    console.error("Unlock Error:", error);
    return { error: "Erro ao processar desbloqueio." };
  }
}
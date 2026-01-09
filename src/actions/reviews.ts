"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitReview(workId: string, rating: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };
  
  try {
    // Upsert: cria uma nova avaliação ou atualiza uma existente
    await prisma.review.upsert({
      where: { userId_workId: { userId: session.user.id, workId } },
      create: { userId: session.user.id, workId, rating },
      update: { rating },
    });
    const work = await prisma.work.findUnique({ where: { id: workId }, select: { slug: true } });
    if (work) revalidatePath(`/obra/${work.slug}`);
    return { success: "Avaliação enviada!" };
  } catch (error) {
    return { error: "Erro ao enviar avaliação." };
  }
}

export async function toggleWorkLike(workId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  try {
    const existingLike = await prisma.workLike.findUnique({
      where: { userId_workId: { userId: session.user.id, workId } },
    });
    
    if (existingLike) {
      await prisma.workLike.delete({ where: { userId_workId: { userId: session.user.id, workId } } });
    } else {
      await prisma.workLike.create({ data: { userId: session.user.id, workId } });
    }
    const work = await prisma.work.findUnique({ where: { id: workId }, select: { slug: true } });
    if (work) revalidatePath(`/obra/${work.slug}`);
    return { success: true };
  } catch (error) {
    return { error: "Erro ao favoritar obra." };
  }
}
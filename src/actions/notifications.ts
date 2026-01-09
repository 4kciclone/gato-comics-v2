"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Cria uma notificação para um usuário.
 */
export async function createNotification(
  userId: string, 
  type: "LIKE" | "REPLY" | "FOLLOW", 
  link: string
) {
  const session = await auth();
  const originUserId = session?.user?.id;

  // Não cria notificação se a ação for do próprio usuário ou se não estiver logado
  if (!originUserId || userId === originUserId) {
    return;
  }

  try {
    await prisma.notification.create({
      data: {
        userId,
        originUserId,
        type,
        link,
      },
    });
    // Revalida o caminho do layout para o sino de notificação atualizar (se necessário)
    revalidatePath("/(main)/layout");
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
  }
}

/**
 * Marca todas as notificações de um usuário como lidas.
 */
export async function markNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/(main)/layout");
  } catch (error) {
    console.error("Erro ao marcar notificações como lidas:", error);
  }
}
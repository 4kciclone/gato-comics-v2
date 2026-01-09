"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ModerationState = { error?: string; success?: string; } | null;

/**
 * Server Action para um usuário criar uma denúncia contra um comentário ou post.
 */
export async function createReport(
  prevState: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Login necessário para denunciar." };
  }

  const commentId = formData.get("commentId") as string | null;
  const postId = formData.get("postId") as string | null;
  const reason = formData.get("reason") as string;
  const notes = formData.get("notes") as string;

  if (!commentId && !postId) {
    return { error: "Conteúdo a ser denunciado não foi especificado." };
  }
  if (!reason) {
    return { error: "Um motivo é obrigatório." };
  }

  try {
    // Verifica se este usuário já não denunciou este conteúdo
    const existingReport = await prisma.report.findFirst({
      where: { 
        reporterId: session.user.id,
        ...(commentId && { commentId }),
        ...(postId && { postId }),
      }
    });

    if (existingReport) {
      return { error: "Você já denunciou este conteúdo." };
    }

    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reason,
        notes,
        commentId: commentId || undefined,
        postId: postId || undefined,
      },
    });
  } catch (error) {
    console.error("Erro ao criar denúncia:", error);
    return { error: "Não foi possível enviar a denúncia." };
  }

  return { success: "Denúncia enviada com sucesso. Nossa equipe de moderação irá analisar." };
}

/**
 * Server Action para o Admin resolver uma denúncia.
 */
export async function resolveReport(
  prevState: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'OWNER') {
    return { error: "Acesso negado." };
  }

  const reportId = formData.get("reportId") as string;
  const action = formData.get("action") as "DISMISS" | "PUNISH";
  const punishmentType = formData.get("punishmentType") as "DELETE_COMMENT" | "MUTE_24H" | "MUTE_7D" | "BAN";
  
  if (!reportId || !action) {
    return { error: "Ação inválida." };
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { 
        comment: { select: { id: true, userId: true } },
        post: { select: { id: true, userId: true } }
      }
    });
    
    if (!report) return { error: "Denúncia não encontrada." };

    if (action === "DISMISS") {
      // Apenas marca a denúncia como resolvida
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'RESOLVED', resolvedAt: new Date() }
      });
    } else if (action === "PUNISH") {
      const targetUserId = report.comment?.userId || report.post?.userId;
      const contentId = report.commentId || report.postId;
      
      if (!targetUserId || !contentId) return { error: "Conteúdo associado à denúncia não encontrado."};

      let muteUntilDate: Date | undefined;

      switch (punishmentType) {
        case "DELETE_COMMENT":
          if (report.commentId) await prisma.comment.delete({ where: { id: report.commentId } });
          if (report.postId) await prisma.post.delete({ where: { id: report.postId } });
          break;
        case "MUTE_24H":
          muteUntilDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await prisma.user.update({ where: { id: targetUserId }, data: { mutedUntil: muteUntilDate } });
          if (report.commentId) await prisma.comment.delete({ where: { id: report.commentId } });
          if (report.postId) await prisma.post.delete({ where: { id: report.postId } });
          break;
        case "MUTE_7D":
          muteUntilDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await prisma.user.update({ where: { id: targetUserId }, data: { mutedUntil: muteUntilDate } });
          if (report.commentId) await prisma.comment.delete({ where: { id: report.commentId } });
          if (report.postId) await prisma.post.delete({ where: { id: report.postId } });
          break;
        case "BAN":
          muteUntilDate = new Date("9999-12-31");
          await prisma.user.update({ where: { id: targetUserId }, data: { mutedUntil: muteUntilDate } });
          if (report.commentId) await prisma.comment.delete({ where: { id: report.commentId } });
          if (report.postId) await prisma.post.delete({ where: { id: report.postId } });
          break;
      }
      
      // Marca todas as denúncias para este conteúdo como resolvidas
      if (report.commentId) {
        await prisma.report.updateMany({ where: { commentId: report.commentId }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
      }
      if (report.postId) {
        await prisma.report.updateMany({ where: { postId: report.postId }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
      }
    }
  } catch (error) {
    console.error("Erro ao resolver denúncia:", error);
    return { error: "Não foi possível processar a ação." };
  }

  revalidatePath("/admin/moderation");
  return { success: "Ação de moderação concluída." };
}
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CommentState = {
  error?: string;
  success?: boolean;
} | null;

const CommentSchema = z.object({
  content: z.string().min(1, "O comentario nao pode estar vazio.").max(1000, "Comentario muito longo."),
  isSpoiler: z.string().optional(),
  workId: z.string().optional(),
  chapterId: z.string().optional(),
  parentId: z.string().optional(),
  postId: z.string().optional(),
});

export async function createComment(
  prevState: CommentState,
  formData: FormData
): Promise<CommentState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para comentar." };
  }

  // --- VERIFICAÇÃO DE PUNIÇÃO ---
  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mutedUntil: true }
  });

  if (user?.mutedUntil && user.mutedUntil > new Date()) {
      const timeLeftHours = Math.ceil((user.mutedUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60));
      return { error: `Voce esta silenciado e nao pode comentar por mais ${timeLeftHours} horas.` };
  }
  // --- FIM DA VERIFICAÇÃO ---

  const validatedFields = CommentSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessage = fieldErrors.content?.[0] || "Comentario invalido.";
    return { error: errorMessage };
  }

  const { content, isSpoiler, workId, chapterId, parentId, postId } = validatedFields.data;

  if (!workId && !chapterId && !postId) {
    return { error: "Contexto do comentario nao encontrado." };
  }

  try {
    await prisma.comment.create({
      data: {
        content,
        isSpoiler: isSpoiler === "on",
        userId: session.user.id,
        workId: workId || undefined,
        chapterId: chapterId || undefined,
        parentId: parentId || undefined,
        postId: postId || undefined,
      },
    });
  } catch (error) {
    console.error("Erro ao criar comentario:", error);
    return { error: "Nao foi possivel postar o comentario." };
  }

  if (workId) {
    const work = await prisma.work.findUnique({ where: { id: workId }, select: { slug: true } });
    if (work) revalidatePath(`/obra/${work.slug}`);
  }
  if (postId) {
    revalidatePath(`/social/post/${postId}`);
  }

  return { success: true };
}
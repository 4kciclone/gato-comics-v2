"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type WorkState = {
  errors?: {
    title?: string[];
    slug?: string[];
    synopsis?: string[];
    author?: string[];
    artist?: string[];
    studio?: string[];
    genres?: string[];
    coverUrl?: string[];
  };
  message?: string | null;
};

// Ação para CRIAR uma nova obra
export async function createWork(prevState: WorkState, formData: FormData): Promise<WorkState> {
  const CreateWorkSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 letras"),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug inválido (use a-z, 0-9, -)"),
    synopsis: z.string().min(10, "A sinopse deve ter pelo menos 10 caracteres"),
    author: z.string().min(2, "Nome do autor é obrigatório"),
    artist: z.string().optional(),
    studio: z.string().optional(),
    coverUrl: z.string().url("Deve ser uma URL válida"),
    genres: z.string().transform((str) => str.split(',').map((s) => s.trim()).filter((s) => s.length > 0)),
  });

  const validatedFields = CreateWorkSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro nos campos. Verifique e tente novamente.',
    };
  }

  const { title, slug, synopsis, author, artist, studio, coverUrl, genres } = validatedFields.data;

  try {
    await prisma.work.create({
      data: {
        title, slug, synopsis, author, artist, studio, coverUrl, genres,
        isAdult: formData.get('isAdult') === 'on',
        isHidden: true, // Começa como OCULTO por padrão
      },
    });
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return { message: 'Este slug já está em uso.' };
    }
    console.error('Database Error:', error);
    return { message: 'Erro interno ao salvar no banco de dados.' };
  }

  revalidatePath('/admin/works');
  return { message: 'Obra criada com sucesso!' };
}

/**
 * Server Action para alternar o estado de visibilidade de uma obra (público/oculto).
 */
export async function toggleWorkVisibility(workId: string, currentState: boolean) {
  try {
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: {
        isHidden: !currentState, // Inverte o estado booleano atual
      },
      select: { slug: true } // Seleciona apenas o slug para revalidação
    });

    // Revalida todas as páginas que podem ser afetadas por esta mudança
    revalidatePath("/admin/works");             // Lista de obras no admin
    revalidatePath(`/admin/works/${workId}`);    // Página de detalhes da obra no admin
    revalidatePath(`/obra/${updatedWork.slug}`);// Página pública da obra
    revalidatePath("/");                         // Home page (pode listar a obra)
    revalidatePath("/busca");                    // Página de busca

    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar visibilidade da obra:", error);
    return { error: "Não foi possível alterar a visibilidade da obra." };
  }
}
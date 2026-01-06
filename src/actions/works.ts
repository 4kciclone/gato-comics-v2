"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Tipo para o estado de retorno do formulário, usado para feedback
export type WorkState = {
  errors?: {
    title?: string[];
    slug?: string[];
    synopsis?: string[];
    author?: string[];
    artist?: string[];
    studio?: string[];
    genres?: string[];
    coverImage?: string[];
  };
  message?: string | null;
  success?: string | null;
};

// Schema de validação Zod, agora esperando um 'File' para 'coverImage'
const CreateWorkSchema = z.object({
  title: z.string().min(3, "O título é muito curto."),
  slug: z.string().min(3, "O slug é muito curto.").regex(/^[a-z0-9-]+$/, "Slug pode conter apenas letras minúsculas, números e hifens."),
  synopsis: z.string().min(10, "A sinopse é muito curta."),
  author: z.string().min(2, "O nome do autor é obrigatório."),
  artist: z.string().optional(),
  studio: z.string().optional(),
  genres: z.string().transform((str) => str.split(',').map(s => s.trim()).filter(Boolean)),
  coverImage: z.instanceof(File, { message: "A imagem da capa é obrigatória." })
             .refine(file => file.size > 0, "A imagem da capa é obrigatória."),
});

/**
 * Server Action para criar uma nova obra, incluindo o upload da capa para o R2.
 */
export async function createWork(prevState: WorkState, formData: FormData): Promise<WorkState> {
  
  const validatedFields = CreateWorkSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    console.error("Erros de validação:", validatedFields.error.flatten().fieldErrors);
    return { 
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Erro de validacao. Por favor, verifique os campos." 
    };
  }

  const { title, slug, synopsis, author, artist, studio, genres, coverImage } = validatedFields.data;
  let coverUrl = "";

  // 1. Upload da Capa para o Cloudflare R2
  try {
    const arrayBuffer = await coverImage.arrayBuffer();
    const extension = coverImage.name.split('.').pop();
    const key = `covers/${slug}-${crypto.randomUUID()}.${extension}`;

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: coverImage.type,
    }));
    
    coverUrl = `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("Erro no upload da capa:", error);
    return { message: "Falha ao enviar a imagem da capa." };
  }

  // 2. Salvar dados no Banco de Dados
  try {
    await prisma.work.create({
      data: {
        title, slug, synopsis, author, artist, studio, genres,
        coverUrl, // Usa a URL gerada pelo R2
        isAdult: formData.get('isAdult') === 'on',
        isHidden: true,
      },
    });
  } catch (error) {
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('slug')) {
      return { message: 'Este Slug (URL) já está em uso. Por favor, escolha outro.' };
    }
    console.error('Erro de banco de dados:', error);
    return { message: 'Erro interno ao salvar a obra no banco de dados.' };
  }

  revalidatePath('/admin/works');
  return { success: "Obra criada com sucesso! Você já pode adicionar capítulos." };
}

/**
 * Server Action para alternar o estado de visibilidade de uma obra (público/oculto).
 */
export async function toggleWorkVisibility(workId: string, currentState: boolean) {
  try {
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: { isHidden: !currentState },
      select: { slug: true }
    });

    revalidatePath("/admin/works");
    revalidatePath(`/admin/works/${workId}`);
    revalidatePath(`/obra/${updatedWork.slug}`);
    revalidatePath("/");
    revalidatePath("/busca");

    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar visibilidade da obra:", error);
    return { error: "Não foi possível alterar a visibilidade da obra." };
  }
}
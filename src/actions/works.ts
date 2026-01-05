'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 1. Schema de Validação (Zod)
const CreateWorkSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 letras"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug inválido (use a-z, 0-9, -)"),
  synopsis: z.string().min(10, "A sinopse deve ter pelo menos 10 caracteres"),
  author: z.string().min(2, "Nome do autor é obrigatório"),
  artist: z.string().optional(),
  studio: z.string().optional(),
  coverUrl: z.string().url("Deve ser uma URL válida"),
  // Transforma "Ação, Isekai" em ["Ação", "Isekai"]
  genres: z.string().transform((str) => 
    str.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
  ),
});

// 2. Definição de Tipos para o Frontend
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

// 3. A Função Server Action
export async function createWork(prevState: WorkState, formData: FormData): Promise<WorkState> {
  // Validação dos dados brutos
  const validatedFields = CreateWorkSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    synopsis: formData.get('synopsis'),
    author: formData.get('author'),
    artist: formData.get('artist'),
    studio: formData.get('studio'),
    coverUrl: formData.get('coverUrl'),
    genres: formData.get('genres'),
  });

  // Se falhar na validação do Zod
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro nos campos. Verifique e tente novamente.',
    };
  }

  const { title, slug, synopsis, author, artist, studio, coverUrl, genres } = validatedFields.data;

  try {
    // Inserção no Banco de Dados
    await prisma.work.create({
      data: {
        title,
        slug,
        synopsis,
        author,
        artist,
        studio,
        coverUrl,
        genres, // Array de strings nativo do Postgres
        isAdult: formData.get('isAdult') === 'on', // Checkbox retorna 'on' ou null
        isHidden: true, // Padrão: Oculto até ter capítulos
      },
    });
  } catch (error) {
    // Tratamento de erro de chave única (Slug duplicado)
    if ((error as any).code === 'P2002') {
      return {
        message: 'Este slug já está em uso. Escolha outro.',
      };
    }
    console.error('Database Error:', error);
    return {
      message: 'Erro interno ao salvar no banco de dados.',
    };
  }

  // Atualiza as rotas necessárias
  revalidatePath('/admin/works');
  
  return { message: 'Obra criada com sucesso!' };
}
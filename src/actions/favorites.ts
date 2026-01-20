"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tipo de retorno compatível com o componente cliente
export type ToggleFavoriteState = {
  success?: boolean;
  error?: string;
};

export async function toggleFeaturedWork(workId: string): Promise<ToggleFavoriteState> {
  const session = await auth();

  // 1. Verificação de Auth
  if (!session?.user?.id) {
    return { error: "Você precisa estar logado para realizar esta ação." };
  }

  const userId = session.user.id;

  try {
    // 2. Buscar o estado atual dos destaques do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        featuredWorks: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      return { error: "Usuário não encontrado." };
    }

    // Verifica se a obra já está na lista de destaques
    const isAlreadyFeatured = user.featuredWorks.some((w) => w.id === workId);

    if (isAlreadyFeatured) {
      // --- REMOVER DO TOP 5 (Disconnect) ---
      await prisma.user.update({
        where: { id: userId },
        data: {
          featuredWorks: {
            disconnect: { id: workId }
          }
        }
      });
      
    } else {
      // --- ADICIONAR AO TOP 5 (Connect) ---
      
      // Validação de Limite
      if (user.featuredWorks.length >= 5) {
        return { error: "Você já atingiu o limite de 5 obras destacadas no perfil." };
      }

      // Validação se a obra existe (Segurança)
      const workExists = await prisma.work.findUnique({ 
        where: { id: workId },
        select: { id: true }
      });
      
      if (!workExists) {
        return { error: "Obra inválida ou não encontrada." };
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          featuredWorks: {
            connect: { id: workId }
          }
        }
      });
    }

    // 3. Atualizar a página para refletir a mudança
    revalidatePath("/profile");
    return { success: true };

  } catch (error) {
    console.error("Erro ao atualizar favoritos em destaque:", error);
    return { error: "Ocorreu um erro ao atualizar seu perfil. Tente novamente." };
  }
}
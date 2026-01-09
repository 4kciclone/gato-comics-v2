"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Busca todos os dados necessários para a página do leitor de capítulos.
 * 
 * Inclui:
 * - Informações da obra e do capítulo.
 * - Lógica de permissão (paywall) para verificar se o capítulo está desbloqueado.
 * - Navegação para o capítulo anterior e próximo.
 * - Rastreamento do histórico de leitura do usuário.
 * - Retorna a sessão do usuário para uso em outros componentes.
 */
export async function getChapterData(workSlug: string, chapterSlug: string) {
  const session = await auth();

  // 1. Busca metadados da obra
  const work = await prisma.work.findUnique({
    where: { slug: workSlug },
    select: { id: true, title: true, slug: true }
  });

  if (!work) {
    return { success: false, error: 'Obra nao encontrada', code: 404 } as const;
  }

  // 2. Busca capítulo e vizinhos para navegação
  const chapter = await prisma.chapter.findUnique({
    where: {
      workId_slug: {
        workId: work.id,
        slug: chapterSlug
      }
    },
    include: {
      work: {
        select: {
          slug: true,
          chapters: {
            select: { slug: true, order: true },
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });

  if (!chapter) {
    return { success: false, error: 'Capitulo nao encontrado', code: 404 } as const;
  }

  // 3. LÓGICA DE PAYWALL CORRIGIDA
  // A variável 'isUnlocked' agora começa APENAS com o status de gratuidade do capítulo.
  let isUnlocked = chapter.isFree;

  // A verificação de compra/aluguel só acontece se o capítulo não for gratuito E o usuário estiver logado.
  if (!isUnlocked && session?.user?.id) {
    
    // Admins e Owners sempre têm acesso total para facilitar a moderação.
    // @ts-ignore
    if (session.user.role === 'ADMIN' || session.user.role === 'OWNER') {
        isUnlocked = true;
    } else {
        // Busca um registro de desbloqueio para este usuário e capítulo específico.
        const unlockRecord = await prisma.unlock.findUnique({
            where: {
                userId_chapterId: {
                    userId: session.user.id,
                    chapterId: chapter.id
                }
            }
        });

        if (unlockRecord) {
            // Se o registro for do tipo 'PERMANENT', o acesso é garantido.
            if (unlockRecord.type === 'PERMANENT') {
                isUnlocked = true;
            } 
            // Se for 'RENTAL', verifica se a data de expiração ainda não passou.
            else if (unlockRecord.type === 'RENTAL' && unlockRecord.expiresAt && unlockRecord.expiresAt > new Date()) {
                isUnlocked = true;
            }
        }
    }
  }

  // 4. ATUALIZAÇÃO DA BIBLIOTECA (Histórico de Leitura)
  // Só salva o progresso se o capítulo estiver de fato liberado para o usuário.
  if (isUnlocked && session?.user?.id) {
    try {
      await prisma.libraryEntry.upsert({
        where: { userId_workId: { userId: session.user.id, workId: work.id } },
        create: {
          userId: session.user.id,
          workId: work.id,
          status: 'READING',
          lastReadChapterId: chapter.id
        },
        update: {
          lastReadChapterId: chapter.id,
          status: 'READING',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      // Falha silenciosa para não impedir a experiência de leitura.
      console.error("Falha ao atualizar o histórico de leitura:", error);
    }
  }

  // 5. Prepara a navegação para os botões "Anterior" e "Próximo"
  const sortedChapters = chapter.work.chapters;
  const currentIndex = sortedChapters.findIndex(c => c.slug === chapter.slug);
  const prevChapter = sortedChapters[currentIndex - 1] || null;
  const nextChapter = sortedChapters[currentIndex + 1] || null;

  return {
    success: true,
    session: session, // Passa a sessão completa para uso no frontend (ex: recomendações)
    work,
    chapter: {
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
      // Segurança: A lista de imagens só é enviada se o acesso for liberado.
      images: isUnlocked ? chapter.images : [], 
      isUnlocked,
      priceLite: chapter.priceLite,
      pricePremium: chapter.pricePremium
    },
    navigation: {
      prev: prevChapter,
      next: nextChapter
    }
  } as const;
}
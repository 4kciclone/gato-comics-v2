"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getChapterData(workSlug: string, chapterSlug: string) {
  const session = await auth();

  // 1. Busca de Dados Essenciais
  const work = await prisma.work.findUnique({
    where: { slug: workSlug },
    select: { id: true, title: true, slug: true }
  });

  if (!work) return { success: false, error: 'Obra nao encontrada', code: 404 } as const;

  const chapter = await prisma.chapter.findUnique({
    where: {
      workId_slug: { workId: work.id, slug: chapterSlug }
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

  if (!chapter) return { success: false, error: 'Capitulo nao encontrado', code: 404 } as const;

  // 2. LÓGICA DE ACESSO COMPLETA
  let isUnlocked = chapter.isFree;

  if (!isUnlocked && session?.user?.id) {
    
    // --- PASSO 1: VERIFICAÇÃO DE "FREEPASS" DA ASSINATURA ---
    // Verifica se o usuário tem um 'WorkEntitlement' ativo para esta obra.
    const entitlement = await prisma.workEntitlement.findUnique({
      where: {
        userId_workId: {
          userId: session.user.id,
          workId: work.id
        }
      },
      // Para performance, só precisamos saber se ele existe
      select: { id: true } 
    });

    if (entitlement) {
      isUnlocked = true; // Se tem o "vínculo", libera o acesso imediatamente.
    }
    // --- FIM DA VERIFICAÇÃO DE "FREEPASS" ---

    // Se não tiver o "Freepass", a lógica continua como antes
    if (!isUnlocked) {
      // @ts-ignore - Admin/Owner têm acesso
      if (session.user.role === 'ADMIN' || session.user.role === 'OWNER') {
          isUnlocked = true;
      } else {
          // Verifica o desbloqueio por patinhas (compra/aluguel)
          const unlockRecord = await prisma.unlock.findUnique({
              where: { userId_chapterId: { userId: session.user.id, chapterId: chapter.id } }
          });
          if (unlockRecord) {
              if (unlockRecord.type === 'PERMANENT' || (unlockRecord.type === 'RENTAL' && unlockRecord.expiresAt && unlockRecord.expiresAt > new Date())) {
                  isUnlocked = true;
              }
          }
      }
    }
  }
  
  // ... (código para ATUALIZAÇÃO DA BIBLIOTECA e NAVEGAÇÃO, sem alterações)
  if (isUnlocked && session?.user?.id) { /* ... */ }
  const prevChapter = null; // simulado
  const nextChapter = null; // simulado

  return {
    success: true,
    session: session,
    work,
    chapter: {
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
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
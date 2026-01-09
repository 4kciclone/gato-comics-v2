"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Tipo explícito para os itens de navegação
type NavChapter = { slug: string; order: number; } | null;

export async function getChapterData(workSlug: string, chapterSlug: string) {
  const session = await auth();

  // 1. Busca de Dados Essenciais
  const work = await prisma.work.findUnique({
    where: { slug: workSlug },
    select: { id: true, title: true, slug: true }
  });
  if (!work) return { success: false, error: 'Obra nao encontrada', code: 404 } as const;

  const chapter = await prisma.chapter.findUnique({
    where: { workId_slug: { workId: work.id, slug: chapterSlug } },
    include: {
      work: {
        select: {
          slug: true,
          chapters: { select: { slug: true, order: true }, orderBy: { order: 'asc' } }
        }
      }
    }
  });
  if (!chapter) return { success: false, error: 'Capitulo nao encontrado', code: 404 } as const;

  // 2. Lógica de Acesso
  let isUnlocked = chapter.isFree;
  if (!isUnlocked && session?.user?.id) {
    const entitlement = await prisma.workEntitlement.findUnique({ where: { userId_workId: { userId: session.user.id, workId: work.id } } });
    if (entitlement) {
      isUnlocked = true;
    }
    if (!isUnlocked) {
      // @ts-ignore
      if (session.user.role === 'ADMIN' || session.user.role === 'OWNER') {
        isUnlocked = true;
      } else {
        const unlockRecord = await prisma.unlock.findUnique({ where: { userId_chapterId: { userId: session.user.id, chapterId: chapter.id } } });
        if (unlockRecord && (unlockRecord.type === 'PERMANENT' || (unlockRecord.type === 'RENTAL' && unlockRecord.expiresAt && unlockRecord.expiresAt > new Date()))) {
          isUnlocked = true;
        }
      }
    }
  }
  
  // 3. Atualização de Histórico
  if (isUnlocked && session?.user?.id) {
    try {
      await prisma.libraryEntry.upsert({
        where: { userId_workId: { userId: session.user.id, workId: work.id } },
        create: { userId: session.user.id, workId: work.id, status: 'READING', lastReadChapterId: chapter.id },
        update: { lastReadChapterId: chapter.id, status: 'READING', updatedAt: new Date() }
      });
    } catch (error) { console.error("Falha ao atualizar biblioteca:", error); }
  }

  // 4. Lógica de Navegação
  const sortedChapters = chapter.work.chapters;
  const currentIndex = sortedChapters.findIndex(c => c.slug === chapter.slug);
  const prevChapter: NavChapter = sortedChapters[currentIndex - 1] || null;
  const nextChapter: NavChapter = sortedChapters[currentIndex + 1] || null;

  return {
    success: true,
    session,
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
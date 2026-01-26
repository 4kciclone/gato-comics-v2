import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

type Props = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, props: Props) {
  try {
    const params = await props.params;
    const chapterId = params.id;

    // 1. Identificar Usuário (se houver token)
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
        userId = decoded.userId;
      } catch (e) {
        // Token inválido ou expirado, segue como visitante
      }
    }

    // 2. Buscar Dados do Capítulo Atual
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        title: true,
        order: true,
        isFree: true,
        images: true,
        workId: true,
        workStatus: true,
      }
    });

    if (!chapter || chapter.workStatus !== 'PUBLISHED') {
      return NextResponse.json({ error: "Capítulo indisponível" }, { status: 404 });
    }

    // 3. Verificar Permissão de Acesso
    if (!chapter.isFree) {
      if (!userId) {
        return NextResponse.json({ error: "Login necessário para conteúdo pago" }, { status: 401 });
      }

      // Verifica assinatura (WorkEntitlement)
      const entitlement = await prisma.workEntitlement.findUnique({
        where: { userId_workId: { userId, workId: chapter.workId } }
      });

      // Verifica desbloqueio avulso (Unlock)
      const unlock = await prisma.unlock.findUnique({
        where: { userId_chapterId: { userId, chapterId } }
      });

      const hasValidUnlock = unlock && (
        unlock.type === 'PERMANENT' || 
        (unlock.expiresAt && new Date(unlock.expiresAt) > new Date())
      );

      if (!entitlement && !hasValidUnlock) {
        return NextResponse.json({ error: "Capítulo bloqueado" }, { status: 403 });
      }
    }

    // 4. Buscar IDs para Navegação (Próximo e Anterior)
    const [prevChapter, nextChapter] = await Promise.all([
      prisma.chapter.findFirst({
        where: { workId: chapter.workId, workStatus: 'PUBLISHED', order: { lt: chapter.order } },
        orderBy: { order: 'desc' },
        select: { id: true }
      }),
      prisma.chapter.findFirst({
        where: { workId: chapter.workId, workStatus: 'PUBLISHED', order: { gt: chapter.order } },
        orderBy: { order: 'asc' },
        select: { id: true }
      })
    ]);

    // 5. Atualizar Histórico de Leitura (Fire and forget)
    if (userId) {
      prisma.libraryEntry.upsert({
        where: { userId_workId: { userId, workId: chapter.workId } },
        create: { userId, workId: chapter.workId, lastReadChapterId: chapterId, status: 'READING' },
        update: { lastReadChapterId: chapterId, updatedAt: new Date() }
      }).catch(err => console.error("Erro ao atualizar histórico:", err));
    }

    return NextResponse.json({
      images: chapter.images,
      title: chapter.title,
      order: chapter.order,
      prevId: prevChapter?.id || null,
      nextId: nextChapter?.id || null
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
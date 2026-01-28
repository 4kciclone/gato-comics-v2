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

    console.log(`[API] Content Request para Chapter: ${chapterId}`);


    if (!chapterId || chapterId === 'undefined') {
        return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 1. Auth Segura
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
        userId = decoded.userId;
      } catch (e) {
        // Token inválido, segue como null
      }
    }

    console.log(`[API] UserId identificado: ${userId}`);

    // 2. Buscar Capítulo
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true, title: true, order: true, isFree: true,
        images: true, workId: true, workStatus: true, // Certifique-se que 'images' existe no schema
      }
    });

    if (!chapter) {
      return NextResponse.json({ error: "Capítulo não encontrado" }, { status: 404 });
    }

     if (!chapter) console.log("[API] Capítulo não encontrado no DB");
     else console.log(`[API] Capítulo encontrado. É grátis? ${chapter.isFree}`);


    // 3. Verificação de Bloqueio
    if (!chapter.isFree) {
      if (!userId) {
        return NextResponse.json({ error: "Login necessário" }, { status: 401 });
      }

      const entitlement = await prisma.workEntitlement.findUnique({
        where: { userId_workId: { userId, workId: chapter.workId } }
      });

      const unlock = await prisma.unlock.findUnique({
        where: { userId_chapterId: { userId, chapterId } }
      });

      console.log(`[API] Unlock status:`, unlock);

      const isRented = unlock?.type === 'RENTAL' && unlock.expiresAt && new Date(unlock.expiresAt) > new Date();
      const isOwned = unlock?.type === 'PERMANENT';

      if (!entitlement && !isOwned && !isRented) {
        return NextResponse.json({ error: "Capítulo bloqueado" }, { status: 403 });
      }
    }

    // 4. Navegação
    const [prev, next] = await Promise.all([
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

    // 5. Retorno Seguro
    return NextResponse.json({
      images: chapter.images || [], // Garante array vazio se for null
      title: chapter.title,
      order: chapter.order,
      prevId: prev?.id || null,
      nextId: next?.id || null
    });

  } catch (error) {
    console.error("Erro GET Content:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;

    // 1. Tentar pegar o usuário pelo Token (se estiver logado)
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

    // 2. Buscar a Obra e os Capítulos
    const work = await prisma.work.findUnique({
      where: { slug },
      include: {
        chapters: {
          where: { workStatus: "PUBLISHED" },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            isFree: true,
            pricePremium: true,
            priceLite: true,
            createdAt: true,
          }
        },
        _count: { select: { chapters: true } }
      }
    });

    if (!work) return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });

    // 3. Se tiver usuário, buscar os desbloqueios dele para essa obra
    let userUnlocks: any[] = [];
    if (userId) {
      userUnlocks = await prisma.unlock.findMany({
        where: {
          userId,
          chapter: { workId: work.id }
        }
      });
    }

    // 4. Mapear capítulos adicionando status de acesso
    const chaptersWithStatus = work.chapters.map(ch => {
      const unlock = userUnlocks.find(u => u.chapterId === ch.id);
      
      let status = "LOCKED"; 
      let expiresAt = null;

      if (ch.isFree) {
        status = "FREE";
      } else if (unlock) {
        if (unlock.type === "PERMANENT") {
          status = "OWNED";
        } else {
          // Verifica se o aluguel ainda é válido
          const now = new Date();
          const expireDate = new Date(unlock.expiresAt);
          if (expireDate > now) {
            status = "RENTED";
            expiresAt = unlock.expiresAt;
          } else {
            status = "EXPIRED"; // Aluguel venceu
          }
        }
      }

      return {
        ...ch,
        status,
        expiresAt
      };
    });

    return NextResponse.json({
      work: {
        id: work.id,
        title: work.title,
        synopsis: work.synopsis,
        coverUrl: work.coverUrl,
        author: work.author,
        genres: work.genres,
        isAdult: work.isAdult,
      },
      chapters: chaptersWithStatus
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
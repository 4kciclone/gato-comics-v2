import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
    const userId = decoded.userId;

    // Pega os filtros da URL (ex: ?status=READING)
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const library = await prisma.libraryEntry.findMany({
      where: {
        userId,
        ...(statusFilter ? { status: statusFilter as any } : {})
      },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            author: true,
            isAdult: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' } // Os lidos mais recentemente primeiro
    });

    // Formata a resposta para facilitar no Mobile
    const formatted = library.map(entry => ({
        work: entry.work,
        status: entry.status,
        lastReadChapterId: entry.lastReadChapterId,
        updatedAt: entry.updatedAt
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Busca as obras publicadas
    // Você pode adicionar paginação (take/skip) depois
    const works = await prisma.work.findMany({
      where: {
        isHidden: false, // Apenas obras visíveis
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        author: true,
        isAdult: true, // Importante para filtros
      },
      orderBy: {
        updatedAt: 'desc', // As mais recentes primeiro
      },
      take: 20, // Limite inicial de 20
    });

    return NextResponse.json(works);
  } catch (error) {
    console.error("Erro ao buscar obras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
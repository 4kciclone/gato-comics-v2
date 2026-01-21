import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
    const userId = decoded.userId;

    const { workId, chapterId, status } = await req.json();

    // Upsert na LibraryEntry
    await prisma.libraryEntry.upsert({
        where: { userId_workId: { userId, workId } },
        create: {
            userId,
            workId,
            lastReadChapterId: chapterId,
            status: status || 'READING'
        },
        update: {
            lastReadChapterId: chapterId,
            // Só atualiza status se for enviado
            ...(status ? { status } : {})
        }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Erro ao sincronizar" }, { status: 500 });
  }
}
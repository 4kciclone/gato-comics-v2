import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Definição do tipo para Next.js 15+
type Props = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, props: Props) {
  try {
    // CORREÇÃO: Aguardar a Promise dos params
    const params = await props.params;
    const chapterId = params.id;

    // 1. Identificar Usuário
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
        userId = decoded.userId;
      } catch (e) {}
    }

    // 2. Buscar Capítulo
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        isFree: true,
        images: true, // As URLs das imagens
        workId: true,
      }
    });

    if (!chapter) return NextResponse.json({ error: "Capítulo não encontrado" }, { status: 404 });

    // 3. Regra de Segurança
    if (!chapter.isFree) {
      if (!userId) {
        return NextResponse.json({ error: "Login necessário" }, { status: 401 });
      }

      // Verificar se comprou ou alugou
      const unlock = await prisma.unlock.findUnique({
        where: {
          userId_chapterId: { userId, chapterId }
        }
      });

      const hasValidUnlock = unlock && (
        unlock.type === 'PERMANENT' || 
        (unlock.expiresAt && new Date(unlock.expiresAt) > new Date())
      );

      if (!hasValidUnlock) {
        return NextResponse.json({ error: "Capítulo bloqueado. Compre para ler." }, { status: 403 });
      }
    }

    // 4. Se passou, retorna as imagens
    return NextResponse.json({
      images: chapter.images
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
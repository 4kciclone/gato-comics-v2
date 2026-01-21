import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { z } from "zod";

// ----------------------------------------------------------------------
// Schema de Validação para Criação de Comentário
// ----------------------------------------------------------------------
const CommentSchema = z.object({
  content: z.string().min(1, "O comentário não pode ser vazio").max(1000, "Máximo de 1000 caracteres"),
  workId: z.string().optional(),
  chapterId: z.string().optional(),
  parentId: z.string().optional(), // ID do comentário pai (se for resposta)
});

// ----------------------------------------------------------------------
// GET: Buscar Comentários
// ----------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workId = searchParams.get("workId");
    const chapterId = searchParams.get("chapterId");
    const parentId = searchParams.get("parentId"); // Opcional: buscar respostas de um comentário
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    // Regra: Precisa filtrar por Obra, Capítulo ou ser uma busca de Respostas
    if (!workId && !chapterId && !parentId) {
      return NextResponse.json({ error: "Informe workId, chapterId ou parentId" }, { status: 400 });
    }

    const whereClause: any = {};
    
    if (parentId) {
      // Se tiver parentId, busca as respostas daquele comentário específico
      whereClause.parentId = parentId;
    } else {
      // Se não, busca comentários raiz (sem pai) filtrados por contexto
      whereClause.parentId = null;
      if (chapterId) whereClause.chapterId = chapterId;
      else if (workId) whereClause.workId = workId;
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            role: true,
            // Trazendo os cosméticos equipados para exibir no App
            equippedAvatarFrame: {
              select: { id: true, imageUrl: true }
            },
            equippedCommentBackground: {
              select: { id: true, imageUrl: true }
            },
            // Cor do nome ou banner podem ser adicionados aqui se necessário
          }
        },
        _count: {
          select: { replies: true } // Contagem de respostas para mostrar botão "Ver respostas"
        }
      },
      orderBy: { createdAt: "desc" }, // Mais recentes primeiro
      take: limit,
      skip: skip,
    });

    return NextResponse.json(comments);

  } catch (error) {
    console.error("Erro ao buscar comentários:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Criar Comentário
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // 1. Autenticação (JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    let userId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
        userId = decoded.userId;
    } catch(e) {
        return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
    }

    // 2. Validação dos Dados
    const body = await req.json();
    const result = CommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        error: "Dados inválidos", 
        details: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { content, workId, chapterId, parentId } = result.data;

    // Deve estar vinculado a algo
    if (!workId && !chapterId && !parentId) {
       return NextResponse.json({ error: "Comentário deve estar vinculado a Obra ou Capítulo" }, { status: 400 });
    }

    // 3. Verifica se o parentId existe (se for resposta)
    if (parentId) {
        const parentExists = await prisma.comment.findUnique({ where: { id: parentId } });
        if (!parentExists) {
            return NextResponse.json({ error: "Comentário pai não encontrado" }, { status: 404 });
        }
    }

    // 4. Criação no Banco
    const newComment = await prisma.comment.create({
      data: {
        content,
        userId,
        workId: workId || undefined,
        chapterId: chapterId || undefined,
        parentId: parentId || undefined,
      },
      include: {
        user: {
            select: {
                id: true,
                username: true,
                image: true,
                role: true,
                equippedAvatarFrame: { select: { imageUrl: true } },
                equippedCommentBackground: { select: { imageUrl: true } }
            }
        }
      }
    });

    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error("Erro ao comentar:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
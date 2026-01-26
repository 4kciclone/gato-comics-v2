import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// GET: Busca o Feed (Global ou Seguindo)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const feedType = searchParams.get('type') || 'global';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    // Auth
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try { userId = (jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any).userId; } catch {}
    }

    let whereClause: any = { parentId: null };

    if (feedType === 'following' && userId) {
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        const followingIds = following.map(f => f.followingId);
        whereClause.userId = { in: followingIds };
    }

    const posts = await prisma.post.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
            user: { select: { id: true, name: true, username: true, image: true, equippedAvatarFrame: { select: { imageUrl: true } } } },
            _count: { select: { likes: true, comments: true } },
            likes: { where: { userId: userId || "0" } }, // Checa se o usuário atual curtiu
        },
    });

    const formattedPosts = posts.map(p => ({
        ...p,
        isLiked: p.likes.length > 0
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar feed" }, { status: 500 });
  }
}

// POST: Criar Post
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
    const userId = decoded.userId;

    // Recebe FormData (pois pode ter imagem)
    const formData = await req.formData();
    const content = formData.get("content") as string;
    const image = formData.get("image") as File | null;

    if (!content) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 });

    let imageUrl: string | undefined = undefined;

    // Upload de Imagem (R2)
    if (image && image.size > 0) {
        const arrayBuffer = await image.arrayBuffer();
        const extension = image.name.split('.').pop();
        const key = `social/${userId}/${crypto.randomUUID()}.${extension}`;
        
        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: Buffer.from(arrayBuffer),
            ContentType: image.type,
        }));
        imageUrl = `${R2_PUBLIC_URL}/${key}`;
    }

    const newPost = await prisma.post.create({
        data: {
            content,
            imageUrl,
            userId,
        }
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 });
  }
}
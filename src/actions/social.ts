"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createNotification } from "./notifications";
import { PostWithMeta } from "@/components/social/post-card";
import { Prisma } from "@prisma/client";

type SocialState = { error?: string; success?: boolean; } | null;
const POSTS_PER_PAGE = 20;

export async function createPost(
  prevState: SocialState, 
  formData: FormData
): Promise<SocialState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Login necessario para postar." };
  }

  // --- VERIFICAÇÃO DE PUNIÇÃO ---
  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mutedUntil: true }
  });

  if (user?.mutedUntil && user.mutedUntil > new Date()) {
      const timeLeftHours = Math.ceil((user.mutedUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60));
      return { error: `Voce esta silenciado e nao pode postar por mais ${timeLeftHours} horas.` };
  }
  // --- FIM DA VERIFICAÇÃO ---

  const PostSchema = z.object({
    content: z.string().min(1, "O post nao pode estar vazio.").max(280, "O post excedeu o limite de 280 caracteres."),
    parentId: z.string().optional(),
    image: z.instanceof(File).optional(),
  });

  const validatedFields = PostSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessage = fieldErrors.content?.[0] || "Post invalido.";
    return { error: errorMessage };
  }

  const { content, parentId, image } = validatedFields.data;
  let imageUrl: string | undefined = undefined;

  if (image && image.size > 0 && !parentId) {
    if (image.size > 4 * 1024 * 1024) {
        return { error: "A imagem nao pode ter mais de 4MB." };
    }
    try {
        const arrayBuffer = await image.arrayBuffer();
        const extension = image.name.split('.').pop();
        const key = `social/${session.user.id}/${crypto.randomUUID()}.${extension}`;
        await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: Buffer.from(arrayBuffer),
            ContentType: image.type,
        }));
        imageUrl = `${R2_PUBLIC_URL}/${key}`;
    } catch (error) {
        return { error: "Falha ao enviar a imagem." };
    }
  }

  try {
    const newPost = await prisma.post.create({
      data: {
        content,
        imageUrl,
        userId: session.user.id,
        parentId: parentId || undefined,
      },
    });

    if (parentId) {
      const parentPost = await prisma.post.findUnique({ where: { id: parentId }, select: { userId: true } });
      if (parentPost) {
        await createNotification(parentPost.userId, "REPLY", `/social/post/${parentId}`);
      }
      revalidatePath(`/social/post/${parentId}`);
    } else {
      revalidatePath("/social");
    }
    
    return { success: true };
  } catch (error) {
    return { error: "Nao foi possivel salvar o post." };
  }
}

export async function toggleLikePost(postId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Usuario nao autenticado.");
    
    try {
        const existingLike = await prisma.like.findUnique({ where: { userId_postId: { userId: session.user.id, postId } } });
        if (existingLike) {
            await prisma.like.delete({ where: { userId_postId: { userId: session.user.id, postId } } });
        } else {
            const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
            if (post) {
                await prisma.like.create({ data: { userId: session.user.id, postId } });
                await createNotification(post.userId, "LIKE", `/social/post/${postId}`);
            }
        }
        revalidatePath(`/social`);
        revalidatePath(`/social/post/${postId}`);
        return { success: true };
    } catch (error) { return { error: "Ocorreu um erro." }; }
}

export async function toggleFollowUser(userIdToFollow: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Usuário não autenticado.");
    
    try {
        const existingFollow = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: session.user.id, followingId: userIdToFollow } } });
        if (existingFollow) {
            await prisma.follow.delete({ where: { followerId_followingId: { followerId: session.user.id, followingId: userIdToFollow } } });
        } else {
            await prisma.follow.create({ data: { followerId: session.user.id, followingId: userIdToFollow } });
            const userToFollowData = await prisma.user.findUnique({ where: { id: userIdToFollow }, select: { username: true } });
            if (userToFollowData?.username) {
                await createNotification(userIdToFollow, "FOLLOW", `/u/${userToFollowData.username}`);
            }
        }
        const user = await prisma.user.findUnique({ where: { id: userIdToFollow }, select: { username: true } });
        if (user?.username) revalidatePath(`/u/${user.username}`);
        return { success: true };
    } catch (error) { return { error: "Ocorreu um erro." }; }
}

export async function deletePost(postId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Acesso negado." };
    try {
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
        if (post?.userId !== session.user.id) return { error: "Voce nao tem permissao para deletar este post." };
        await prisma.post.delete({ where: { id: postId } });
        revalidatePath("/social");
        return { success: true };
    } catch (error) { return { error: "Erro ao deletar post." }; }
}

export async function editPost(postId: string, newContent: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Acesso negado." };
    if (!newContent || newContent.length > 280) return { error: "Conteudo invalido." };
    try {
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
        if (post?.userId !== session.user.id) return { error: "Voce nao tem permissao para editar este post." };
        await prisma.post.update({ where: { id: postId }, data: { content: newContent } });
        revalidatePath(`/social/post/${postId}`);
        return { success: true };
    } catch (error) { return { error: "Erro ao editar post." }; }
}

export async function fetchMorePosts(page: number, feedType: 'global' | 'following'): Promise<PostWithMeta[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    let whereClause: Prisma.PostWhereInput = { parentId: null };

    if (feedType === 'following') {
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        const followingIds = following.map(f => f.followingId);
        if (followingIds.length === 0) return [];
        whereClause.userId = { in: followingIds };
    }

    try {
        const posts = await prisma.post.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: POSTS_PER_PAGE,
            skip: (page - 1) * POSTS_PER_PAGE,
            include: {
                user: { select: { id: true, name: true, username: true, image: true, equippedAvatarFrame: { select: { imageUrl: true } } } },
                _count: { select: { likes: true, comments: true } },
                likes: { where: { userId } },
            },
        });
        return posts.map(post => ({ ...post, isLiked: post.likes.length > 0 }) as PostWithMeta);
    } catch (error) { return []; }
}

export async function getTrendingTopics() {
    try {
        const recentPosts = await prisma.post.findMany({
            where: { parentId: null },
            orderBy: { createdAt: 'desc' },
            take: 1000,
            select: { content: true }
        });
        const hashtagCounts: Record<string, number> = {};
        const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
        for (const post of recentPosts) {
            const matches = post.content.matchAll(hashtagRegex);
            if (matches) {
                for (const match of matches) {
                    const cleanHashtag = `#${match[1].toLowerCase()}`;
                    hashtagCounts[cleanHashtag] = (hashtagCounts[cleanHashtag] || 0) + 1;
                }
            }
        }
        const sortedTopics = Object.entries(hashtagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([topic]) => topic);
        return sortedTopics;
    } catch (error) {
        console.error("Erro ao buscar trending topics:", error);
        return [];
    }
}
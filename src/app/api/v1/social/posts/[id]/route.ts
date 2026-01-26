import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

type Props = { params: Promise<{ id: string }> }

export async function GET(req: Request, props: Props) {
    const params = await props.params;
    const postId = params.id;

    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
         try { userId = (jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET_MOBILE!) as any).userId; } catch {}
    }

    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            user: { select: { id: true, name: true, username: true, image: true, equippedAvatarFrame: { select: { imageUrl: true } } } },
            _count: { select: { likes: true, comments: true } },
            likes: { where: { userId: userId || "0" } },
        }
    });

    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ...post, isLiked: post.likes.length > 0 });
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { createNotification } from "@/actions/notifications"; // Reutilize sua função existente se possível, ou adapte

type Props = { params: Promise<{ id: string }> }

export async function POST(req: Request, props: Props) {
    const params = await props.params;
    const postId = params.id;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const userId = (jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any).userId;

    try {
        const existingLike = await prisma.like.findUnique({
            where: { userId_postId: { userId, postId } }
        });

        if (existingLike) {
            await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
            return NextResponse.json({ liked: false });
        } else {
            await prisma.like.create({ data: { userId, postId } });
            // Notificação (Opcional: implemente lógica similar à da Web aqui)
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        return NextResponse.json({ error: "Erro" }, { status: 500 });
    }
}
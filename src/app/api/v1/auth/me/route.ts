import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Sem token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_MOBILE!) as any;
    } catch (e) {
        return NextResponse.json({ error: "Token expirado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        // Busca lotes de Lite Coins que ainda não venceram
        liteCoinBatches: {
            where: { 
                expiresAt: { gt: new Date() },
                amount: { gt: 0 }
            }
        },
        // Opcional: Buscar cosméticos equipados para mostrar a moldura
        equippedAvatarFrame: true,
      }
    });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Calcula saldo total de Lite
    const liteBalance = user.liteCoinBatches.reduce((acc, batch) => acc + batch.amount, 0);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      role: user.role,
      balancePremium: user.balancePremium,
      balanceLite: liteBalance, // Retornamos o calculado
      subscriptionTier: user.subscriptionTier,
      avatarFrame: user.equippedAvatarFrame?.imageUrl || null
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
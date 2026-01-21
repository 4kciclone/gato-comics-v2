import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Apenas letras, números e underline"),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      // .flatten().fieldErrors retorna um objeto limpo: { email: ["Erro..."], password: ["Erro..."] }
      return NextResponse.json({ 
        error: "Dados inválidos", 
        details: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, username, email, password } = result.data;

    // Verificar duplicidade
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email ou usuário já cadastrados" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário com saldo inicial de boas-vindas (ex: 10 patinhas lite)
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        dateOfBirth: new Date(), // Ajuste conforme necessário ou peça no form
        balancePremium: 0,
        // Você pode criar um LiteCoinBatch inicial aqui se quiser
      }
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });

  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
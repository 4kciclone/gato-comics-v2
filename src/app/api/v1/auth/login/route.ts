import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

// Schema de validação
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Valida os dados de entrada
    const validatedFields = LoginSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { email, password } = validatedFields.data;

    // 2. Busca o usuário no banco
    // Removemos o 'include' pois subscriptionTier é um campo normal da tabela
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Verifica se usuário existe e se tem senha configurada
    if (!user || !user.password) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // 4. Compara a senha enviada com o hash no banco
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // 5. Gera o JWT específico para o Mobile
    // Certifique-se de ter JWT_SECRET_MOBILE no seu .env
    const secret = process.env.JWT_SECRET_MOBILE;
    
    if (!secret) {
      console.error("JWT_SECRET_MOBILE não definido no .env");
      return NextResponse.json({ error: "Erro de configuração no servidor" }, { status: 500 });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        subTier: user.subscriptionTier 
      },
      secret,
      { expiresIn: "30d" } // Sessão longa para mobile
    );

    // 6. Retorna o Token e os dados do usuário (sem a senha)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        balancePremium: user.balancePremium,
        subscriptionTier: user.subscriptionTier, // Agora vem corretamente
      },
    });

  } catch (error) {
    console.error("API Login Error:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
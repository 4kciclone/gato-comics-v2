"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

const RegisterSchema = z.object({
  name: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(50, "Nome muito longo"),
  email: z.string()
    .email("Email inválido")
    .toLowerCase(),
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha muito longa"),
});

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

/**
 * Cria um username único baseado no nome do usuário
 * Executa dentro de uma transação para evitar race conditions
 */
async function createUniqueUsername(
  name: string, 
  tx: Prisma.TransactionClient
): Promise<string> {
  // Normalizar nome para username
  let username = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/gi, '');
  
  // Fallback se o username ficar vazio
  if (!username || username.length < 3) {
    username = `user${Date.now()}`;
  }
  
  // Limitar tamanho máximo
  username = username.substring(0, 20);
  
  // Tentar encontrar username disponível
  let counter = 0;
  let finalUsername = username;
  
  while (true) {
    const existingUser = await tx.user.findUnique({ 
      where: { username: finalUsername },
      select: { id: true }
    });
    
    if (!existingUser) break;
    
    counter++;
    finalUsername = `${username}${counter}`;
    
    // Segurança: evitar loop infinito
    if (counter > 9999) {
      finalUsername = `${username}${Date.now()}`;
      break;
    }
  }
  
  return finalUsername;
}

/**
 * Registra um novo usuário no sistema
 * Inclui bônus de 5 Patinhas Lite com 7 dias de validade
 */
export async function register(
  prevState: AuthState, 
  formData: FormData
): Promise<AuthState> {
  // Validar dados do formulário
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { email, password, name } = validatedFields.data;

  try {
    // Verificar se email já existe (antes da transação)
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true }
    });
    
    if (existingUser) {
      return { error: "Este email já está em uso." };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transação atômica para criar usuário + bônus
    await prisma.$transaction(async (tx) => {
      // Gerar username único dentro da transação
      const username = await createUniqueUsername(name, tx);
      
      // Criar usuário
      const newUser = await tx.user.create({
        data: { 
          name, 
          username, 
          email, 
          password: hashedPassword 
        },
      });

      await tx.activityLog.create({
        data: {
        type: 'NEW_USER',
        message: `${name} acabou de se registrar.`,
        link: `/u/${username}`,
        metadata: { userId: newUser.id }
        }
      });
      
      // Criar lote de Patinhas Lite com 7 dias de validade
      await tx.liteCoinBatch.create({
        data: {
          userId: newUser.id,
          amount: 5,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      
      // Registrar transação do bônus
      await tx.transaction.create({
        data: {
          userId: newUser.id,
          amount: 5,
          currency: "LITE",
          type: "EARN",
          description: "Bônus de Registro",
        },
      });
    });

    return { 
      success: "Conta criada! Você ganhou 5 Patinhas Lite de bônus. Faça login." 
    };

  } catch (error) {
    console.error("Erro no registro:", error);
    
    // Tratamento de erros específicos do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { error: "Email ou username já está em uso." };
      }
    }
    
    return { error: "Erro ao criar conta. Tente novamente." };
  }
}

/**
 * Faz login do usuário usando NextAuth
 */
export async function login(
  prevState: AuthState, 
  formData: FormData
): Promise<AuthState> {
  // Validar dados do formulário
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { error: "Email ou senha inválidos." };
  }

  try {
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirectTo: "/",
    });
    
    return null;
    
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email ou senha incorretos." };
        case "CallbackRouteError":
          return { error: "Erro ao fazer login. Tente novamente." };
        default:
          return { error: "Algo deu errado. Tente novamente." };
      }
    }
    
    // Re-throw para o Next.js tratar redirects
    throw error;
  }
}

/**
 * Faz logout do usuário
 */
export async function logout() {
  try {
    await signOut({ redirectTo: "/login" });
  } catch (error) {
    console.error("Erro no logout:", error);
    throw error;
  }
}
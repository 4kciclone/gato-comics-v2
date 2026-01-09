"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth"; // Verifique se o caminho está correto (@/auth ou @/lib/auth)
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
  redirectTo: z.string().optional(),
});

/**
 * Helper: Cria um username único baseado no nome
 */
async function createUniqueUsername(
  name: string, 
  tx: Prisma.TransactionClient
): Promise<string> {
  let username = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/gi, '');
  
  if (!username || username.length < 3) {
    username = `user${Date.now()}`;
  }
  
  username = username.substring(0, 20);
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
    if (counter > 999) break;
  }
  return finalUsername;
}

/**
 * Action de Registro
 */
export async function register(
  prevState: AuthState, 
  formData: FormData
): Promise<AuthState> {
  const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return { error: Object.values(errors)[0]?.[0] || "Dados inválidos." };
  }

  const { email, password, name } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Este email já está em uso." };

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const username = await createUniqueUsername(name, tx);
      const newUser = await tx.user.create({
        data: { name, username, email, password: hashedPassword },
      });

      // Logs e Bônus
      await tx.activityLog.create({
        data: {
          type: 'NEW_USER',
          message: `${name} acabou de se registrar.`,
          link: `/u/${username}`,
          metadata: { userId: newUser.id }
        }
      });
      
      await tx.liteCoinBatch.create({
        data: {
          userId: newUser.id,
          amount: 5,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      
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

    return { success: "Conta criada! Faça login para continuar." };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao criar conta." };
  }
}

/**
 * Action de Login (Corrigida para evitar login duplo)
 */
export async function login(
  prevState: AuthState, 
  formData: FormData
): Promise<AuthState> {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = LoginSchema.safeParse(data);

  if (!validatedFields.success) return { error: "Campos inválidos." };

  const { email, password, redirectTo } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo || "/",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") return { error: "Credenciais inválidas." };
      return { error: "Erro ao entrar." };
    }
    // IMPORTANTE: Permitir que o Next.js trate o redirecionamento
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
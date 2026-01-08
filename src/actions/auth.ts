"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

const RegisterSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

async function createUniqueUsername(name: string): Promise<string> {
    let username = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/gi, '');
    if (!username) username = `user${Date.now()}`;
    let existingUser = await prisma.user.findUnique({ where: { username } });
    let counter = 1;
    let initialUsername = username;
    while (existingUser) {
        username = `${initialUsername}${counter}`;
        existingUser = await prisma.user.findUnique({ where: { username } });
        counter++;
    }
    return username;
}

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return { error: "Dados invalidos." };
  }

  const { email, password, name } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Email ja esta em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const username = await createUniqueUsername(name);

    await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: { name, username, email, password: hashedPassword },
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
            }
        });
    });

    return { success: "Conta criada! Voce ganhou 5 Patinhas Lite de bonus. Faca login." };

  } catch (error) {
    console.error("Erro no registro:", error);
    return { error: "Erro ao criar conta." };
  }
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": return { error: "Credenciais invalidas!" };
        default: return { error: "Algo deu errado." };
      }
    }
    throw error;
  }
}
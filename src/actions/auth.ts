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

// Função helper para criar um username único e seguro para URLs
async function createUniqueUsername(name: string): Promise<string> {
    // 1. Limpa o nome: minúsculas, sem espaços, remove caracteres especiais
    let username = name
        .toLowerCase()
        .replace(/\s+/g, '') // Remove todos os espaços
        .replace(/[^a-z0-9_]/gi, ''); // Remove tudo que não for letra, número ou underline

    // 2. Garante que não está vazio
    if (!username) {
        username = `user${Date.now()}`;
    }

    // 3. Verifica se já existe e adiciona um número se necessário
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
    const username = await createUniqueUsername(name); // <-- Gera o username único

    await prisma.user.create({
      data: {
        name,
        username, // <-- Salva o novo username no banco
        email,
        password: hashedPassword,
        balanceLite: 5,
      },
    });

    return { success: "Conta criada! Faca login." };

  } catch (error) {
    console.error(error);
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
        case "CredentialsSignin":
          return { error: "Credenciais invalidas!" };
        default:
          return { error: "Algo deu errado." };
      }
    }
    throw error;
  }
}
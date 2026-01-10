"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth"; 
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { differenceInYears } from "date-fns"; 
import { sendWelcomeEmailWithTerms } from "@/lib/mail"; // Importa a função de email

export type AuthState = {
  error?: string;
  success?: string;
} | null;

// ----------------------------------------------------------------------
// SCHEMAS DE VALIDAÇÃO
// ----------------------------------------------------------------------

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
  // Validação LGPD: Data válida
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Data de nascimento inválida",
  }),
  // Validação LGPD: Termos obrigatórios
  terms: z.string().optional().refine((val) => val === "on", {
    message: "Você deve aceitar os Termos de Uso e Política de Privacidade.",
  }),
});

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
  redirectTo: z.string().optional(),
});

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------

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
    if (counter > 9999) {
      finalUsername = `${username}${Date.now()}`;
      break;
    }
  }
  return finalUsername;
}

// ----------------------------------------------------------------------
// ACTIONS
// ----------------------------------------------------------------------

export async function register(
  prevState: AuthState, 
  formData: FormData
): Promise<AuthState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = RegisterSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return { error: Object.values(errors)[0]?.[0] || "Dados inválidos." };
  }

  const { email, password, name, dateOfBirth } = validatedFields.data;

  // --- REGRA LGPD: IDADE MÍNIMA (12 ANOS) ---
  const birthDate = new Date(dateOfBirth);
  const age = differenceInYears(new Date(), birthDate);

  if (age < 12) {
    return { error: "Desculpe, você precisa ter pelo menos 12 anos para criar uma conta." };
  }

  try {
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true }
    });
    
    if (existingUser) {
      return { error: "Este email já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Criação do usuário e bônus
    await prisma.$transaction(async (tx) => {
      const username = await createUniqueUsername(name, tx);
      
      const newUser = await tx.user.create({
        data: { 
          name, 
          username, 
          email, 
          password: hashedPassword,
          dateOfBirth: birthDate,
          termsAcceptedAt: new Date(),
          privacyVersion: "v1.0 (LGPD-2026)",
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

    // --- ENVIO DO EMAIL COM OS TERMOS ---
    // Tentamos enviar o email. Se falhar, logamos o erro, mas não bloqueamos o cadastro.
    try {
      await sendWelcomeEmailWithTerms(email, name);
    } catch (mailError) {
      console.error("Falha ao enviar email de termos:", mailError);
    }

    return { 
      success: "Conta criada! Um email com os termos foi enviado para você. Faça login." 
    };

  } catch (error) {
    console.error("Erro no registro:", error);
    return { error: "Erro ao criar conta. Tente novamente." };
  }
}

export async function login(
  prevState: AuthState, 
  formData: FormData
): Promise<AuthState> {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = LoginSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Email ou senha inválidos." };
  }

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
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email ou senha incorretos." };
        case "CallbackRouteError":
          return { error: "Erro de conexão. Tente novamente." };
        default:
          return { error: "Algo deu errado ao entrar." };
      }
    }
    throw error; // Necessário para o redirect do Next.js funcionar
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
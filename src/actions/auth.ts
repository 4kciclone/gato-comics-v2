"use server";

import { signIn } from "@/lib/auth"; // Verifique se seu arquivo de exportação é @/lib/auth ou @/auth
import { AuthError } from "next-auth";
import { z } from "zod";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
  redirectTo: z.string().optional(),
});

/**
 * Faz login do usuário usando Auth.js v5
 */
export async function login(
  prevState: AuthState, 
  formData: FormData
): Promise<AuthState> {
  // Converte FormData para objeto para o Zod validar
  const data = Object.fromEntries(formData.entries());
  
  const validatedFields = LoginSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Preencha os campos corretamente." };
  }

  const { email, password, redirectTo } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo || "/", // Redireciona para onde o usuário queria ou para a home
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
          return { error: "Algo deu errado no login." };
      }
    }
    
    // IMPORTANTE: O Auth.js lança um erro do tipo "NEXT_REDIRECT" para funcionar.
    // Se você não der "throw error" aqui, o redirecionamento falha e causa o login duplo.
    throw error;
  }
}
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Ajustei para min(1) para evitar erros de validação simples
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;
        
        try {
          const user = await prisma.user.findUnique({ 
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              image: true,
            }
          });
          
          if (!user || !user.password) {
            return null;
          }

          // SE ESTE ARQUIVO FOR DO PROJETO ADMIN:
          // Descomente a linha abaixo para impedir login de usuários comuns
          // if (user.role === 'USER') return null; 
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          
          if (!passwordsMatch) {
            return null;
          }
          
          const { password: _, ...userWithoutPassword } = user;
          return userWithoutPassword;
          
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return null;
        }
      },
    }),
  ],
  // --- AQUI ESTÁ A CORREÇÃO CRÍTICA PARA SUBDOMÍNIOS ---
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-authjs.session-token` 
        : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // O ponto no início (.) permite que o cookie seja lido em:
        // gatocomics.local, admin.gatocomics.local, moderacao.gatocomics.local...
        domain: process.env.NODE_ENV === "production"
          ? ".gatocomics.com.br"
          : ".gatocomics.local", 
      },
    },
  },
});
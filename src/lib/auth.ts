import NextAuth from "next-auth";
import { authConfig } from "./auth.config"; // ou @/lib/auth.config
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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

        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;
        
        try {
          const user = await prisma.user.findUnique({ 
            where: { email },
            // Seleciona apenas o necessário para montar o token
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              image: true,
            }
          });
          
          if (!user || !user.password) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) return null;
          
          const { password: _, ...userWithoutPassword } = user;
          return userWithoutPassword;
          
        } catch (error) {
          return null;
        }
      },
    }),
  ],
});
import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login", // Login local do site
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      // Rotas de Autenticação
      const isOnAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

      if (isOnAuthPage) {
        if (isLoggedIn) {
          // CORREÇÃO: Se já está logado no site, manda para a HOME (/), não para Dashboard
          return Response.redirect(new URL("/", nextUrl)); 
        }
        return true; // Deixa acessar login/register se não estiver logado
      }

      // Proteção de rotas privadas do SITE (Perfil, Leitura Paga, etc)
      const isPrivate = ["/profile", "/settings", "/library"].some(path => nextUrl.pathname.startsWith(path));
      
      if (isPrivate && !isLoggedIn) {
        return false; // Manda pro login
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;
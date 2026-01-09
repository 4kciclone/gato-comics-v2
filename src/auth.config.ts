// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
  authorized({ auth, request: { nextUrl } }) {
    const isLoggedIn = !!auth?.user;
    const { pathname } = nextUrl;

    // 1. Permitir sempre rotas de API e Auth
    if (pathname.startsWith("/api/auth")) return true;

    // 2. Se o usuário estiver logado e tentar acessar login/register, manda para home
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
      return Response.redirect(new URL("/", nextUrl));
    }

    // 3. Se NÃO estiver logado e tentar acessar rotas privadas (como /admin), 
    // o Auth.js redireciona automaticamente para /login se retornarmos false
    const isPublicRoute = ["/", "/login", "/register", "/obra", "/busca", "/shop"].some(path => 
      pathname === path || pathname.startsWith(path + "/")
    );

    if (!isPublicRoute && !isLoggedIn) {
      return false; // Redireciona para login
    }

    return true; // Permite o acesso
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
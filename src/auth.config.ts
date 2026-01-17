import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith("/login");
      const isOnRegisterPage = nextUrl.pathname.startsWith("/register");

      // 1. Se já está logado e tenta acessar Login ou Register, manda para Home
      if (isLoggedIn && (isOnLoginPage || isOnRegisterPage)) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // 2. Proteção de rotas privadas (Ex: Perfil, Configurações)
      // Adicione aqui as rotas que APENAS usuários logados podem ver no site principal
      const privateRoutes = ["/settings", "/profile", "/library"];
      const isPrivateRoute = privateRoutes.some(route => nextUrl.pathname.startsWith(route));

      if (isPrivateRoute && !isLoggedIn) {
        return false; // Redireciona para /login automaticamente
      }

      // Todo o resto é público (Home, Obras, Leitura)
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
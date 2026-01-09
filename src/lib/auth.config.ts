// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // ESTA É A CHAVE PARA RESOLVER O LOGIN DUPLO
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      
      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isPublicRoute = ["/", "/login", "/register", "/obra", "/busca", "/shop"].some(path => 
        nextUrl.pathname === path || nextUrl.pathname.startsWith(path + "/")
      );

      if (isApiAuthRoute) return true;

      // Se for rota admin, verifica login e role
      if (isAdminRoute) {
        if (!isLoggedIn) return false; // Redireciona para login
        if (role !== "ADMIN" && role !== "OWNER") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // Se logado e for para login/register, manda para home
      if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Se não for pública e não estiver logado, redireciona para login
      if (!isPublicRoute && !isLoggedIn) return false;

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
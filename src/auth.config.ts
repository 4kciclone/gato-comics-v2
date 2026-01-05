import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // A lógica de proteção de rotas (Middleware) vem para cá
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isPublicRoute = 
        nextUrl.pathname === "/" || 
        nextUrl.pathname.startsWith("/obra") || 
        nextUrl.pathname.startsWith("/login") || 
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/public"); // Pasta public

      const isAdminRoute = nextUrl.pathname.startsWith("/admin");

      // 1. Rotas de API de Auth são sempre permitidas
      if (isAuthRoute) return true;

      // 2. Proteção de Admin
      if (isAdminRoute) {
        if (isLoggedIn) return true;
        return false; // Redireciona para login
      }

      // 3. Proteção de Rotas Privadas (Leitura, Perfil)
      // Se não for pública e não estiver logado -> Login
      if (!isLoggedIn && !isPublicRoute) {
        return false;
      }

      return true;
    },
    
    // Adicionar ID e Role ao Token
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    // Passar do Token para a Sessão
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [], // Provedores vazios aqui (serão adicionados no auth.ts)
} satisfies NextAuthConfig;
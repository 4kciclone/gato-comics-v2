import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// A anotação @ts-ignore não é mais necessária!
export default auth((req) => {
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const userRole = session?.user?.role; // Agora TypeScript sabe que 'role' existe
  const { nextUrl } = req;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  
  // Rotas públicas que não exigem login
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = 
    publicRoutes.includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith("/obra") ||
    nextUrl.pathname.startsWith("/ler") ||
    nextUrl.pathname.startsWith("/shop") ||
    nextUrl.pathname.startsWith("/busca");

  // Rotas de API da autenticação são sempre permitidas
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // LÓGICA DE PROTEÇÃO DO ADMIN
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (userRole !== "ADMIN" && userRole !== "OWNER") {
      return NextResponse.redirect(new URL("/", nextUrl)); // Redireciona para home se não for admin
    }
  }
  
  // Proteção de rotas privadas genéricas (se houver no futuro)
  if (!isPublicRoute && !isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
  ],
};
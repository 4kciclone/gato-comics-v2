import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const userRole = session?.user?.role;
  const { nextUrl } = req;

  // Rotas de autenticação da API
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  
  // Rotas administrativas
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  
  // Rotas públicas que não exigem autenticação
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/obra",
    "/busca",
    "/shop",
  ];
  
  const isPublicRoute = publicPaths.some(path => 
    nextUrl.pathname === path || nextUrl.pathname.startsWith(path + "/")
  );

  // 1. Sempre permitir rotas de API de autenticação
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // 2. Proteção de rotas administrativas
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (userRole !== "ADMIN" && userRole !== "OWNER") {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
  }
  
  // 3. Redirecionar usuários logados para home se tentarem acessar login/register
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }
  
  // 4. Proteção de rotas privadas
  if (!isPublicRoute && !isAdminRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// src/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// O .auth herda a lógica do callback 'authorized' definido acima
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
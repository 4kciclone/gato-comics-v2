import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config"; // Verifique o caminho correto

export default NextAuth(authConfig).auth;

export const config = {
  // Ignora arquivos estáticos e API
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
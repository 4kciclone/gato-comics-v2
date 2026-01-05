import { UserRole } from "@prisma/client"; // Importa nosso Enum para manter a consistência
import NextAuth, { type DefaultSession } from "next-auth";

// Estende o tipo 'Session' para incluir a propriedade 'role'
declare module "next-auth" {
  interface Session {
    user: {
      /**
       * A role do usuário, vinda do nosso banco de dados.
       */
      role: UserRole;
    } & DefaultSession["user"]; // Une com as propriedades padrão (name, email, image)
  }
}
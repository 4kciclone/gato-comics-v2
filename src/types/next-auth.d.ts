import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    // id, name, email, image já vêm por padrão, 
    // então só precisamos adicionar o que é novo.
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
  }
}
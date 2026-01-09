"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

type AdminActionState = { error?: string; success?: string; } | null;

// Função para dar bônus de patinhas
export async function grantBonus(
  prevState: AdminActionState, 
  formData: FormData
): Promise<AdminActionState> {
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'OWNER') {
    return { error: "Acesso negado." };
  }

  const userId = formData.get("userId") as string;
  const amount = Number(formData.get("amount"));
  const currency = formData.get("currency") as "PREMIUM" | "LITE";
  const reason = formData.get("reason") as string;

  if (!userId || !amount || !currency || !reason) {
    return { error: "Todos os campos são obrigatórios." };
  }

  const currencyField = currency === 'PREMIUM' ? 'balancePremium' : 'balanceLite';

  try {
    await prisma.$transaction([
      // 1. Adiciona o saldo
      prisma.user.update({
        where: { id: userId },
        data: { [currencyField]: { increment: amount } },
      }),
      // 2. Registra a transação
      prisma.transaction.create({
        data: {
          userId,
          amount,
          currency,
          type: 'BONUS',
          description: `Bônus do Admin: ${reason}`,
        }
      })
    ]);
  } catch (error) {
    return { error: "Erro ao conceder bônus." };
  }

  revalidatePath("/admin/users");
  return { success: "Bônus concedido com sucesso!" };
}

// Função para atualizar o cargo de um usuário
export async function updateUserRole(
  prevState: AdminActionState, 
  formData: FormData
): Promise<AdminActionState> {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'OWNER') { // Apenas OWNER pode mudar cargos
        return { error: "Apenas o Dono pode alterar cargos." };
    }

    const userId = formData.get("userId") as string;
    const newRole = formData.get("role") as UserRole;
    
    if (!userId || !newRole) return { error: "Dados inválidos." };

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        });
    } catch (error) {
        return { error: "Erro ao atualizar cargo." };
    }

    revalidatePath("/admin/users");
    return { success: "Cargo do usuário atualizado!" };
}
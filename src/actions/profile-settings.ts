"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { subDays } from "date-fns";

// Definindo o tipo de retorno
export type ProfileState = {
  error?: string;
  success?: string;
} | null;

// Adicionado prevState: any como primeiro argumento
export async function updateProfileSettings(prevState: any, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário" };

  const location = formData.get("location") as string;
  const bio = formData.get("bio") as string;
  const privacySettings = formData.get("privacySettings") as string;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { location, bio, privacySettings }
    });
    revalidatePath("/profile");
    return { success: "Perfil atualizado!" };
  } catch (error) {
    return { error: "Erro ao salvar." };
  }
}

// Adicionado prevState: any como primeiro argumento
export async function changeNickname(prevState: any, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário" };

  const newName = formData.get("nickname") as string;
  if (!newName || newName.length < 3) return { error: "Nome muito curto." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastNicknameChange: true, balancePremium: true }
  });

  if (!user) return { error: "Usuário não encontrado" };

  const now = new Date();
  const ninetyDaysAgo = subDays(now, 90);
  const canChangeFree = !user.lastNicknameChange || user.lastNicknameChange < ninetyDaysAgo;
  const COST = 500; 

  if (!canChangeFree) {
    if (user.balancePremium < COST) {
      return { error: `Você precisa esperar ou pagar ${COST} Patinhas Premium.` };
    }
    
    await prisma.user.update({
        where: { id: session.user.id },
        data: { balancePremium: { decrement: COST } }
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: newName, lastNicknameChange: now }
  });

  revalidatePath("/profile");
  return { success: "Nickname alterado com sucesso!" };
}
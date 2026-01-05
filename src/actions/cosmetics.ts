"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CosmeticType } from "@prisma/client";

// Tipagem unificada para o estado dos formulários
export type CosmeticState = {
  error?: string;
  success?: string;
} | null;

// Schema para criação de cosmético (Admin)
const CosmeticSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["AVATAR_FRAME", "COMMENT_BACKGROUND", "USERNAME_COLOR"]),
  rarity: z.enum(["COMMON", "RARE", "EPIC", "LEGENDARY"]),
  price: z.coerce.number().min(0, "Preço deve ser 0 ou maior"),
  imageUrl: z.string().url("URL da imagem/gif é obrigatória"),
});

/**
 * Server Action para o Admin criar um novo cosmético.
 */
export async function createCosmetic(
  prevState: CosmeticState,
  formData: FormData
): Promise<CosmeticState> {
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'OWNER') {
    return { error: "Acesso negado." };
  }

  const validatedFields = CosmeticSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return { error: "Dados inválidos. Verifique os campos." };
  }
  
  try {
    await prisma.cosmetic.create({
      data: validatedFields.data,
    });
  } catch (error) {
    return { error: "Erro ao salvar o cosmético no banco de dados." };
  }

  revalidatePath("/admin/cosmetics");
  return { success: "Cosmético criado com sucesso!" };
}

/**
 * Server Action para um usuário comprar um cosmético da loja.
 */
export async function buyCosmetic(
  prevState: CosmeticState, 
  formData: FormData
): Promise<CosmeticState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Você precisa estar logado para comprar." };
  }

  const cosmeticId = formData.get("cosmeticId") as string;
  if (!cosmeticId) return { error: "Item inválido." };

  const userId = session.user.id;

  try {
    const [cosmetic, user] = await Promise.all([
      prisma.cosmetic.findUnique({ where: { id: cosmeticId, isActive: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { balancePremium: true } }),
    ]);

    if (!cosmetic) return { error: "Cosmético não encontrado." };
    if (!user) return { error: "Usuário não encontrado." };

    const existingOwnership = await prisma.userCosmetic.findUnique({
      where: { userId_cosmeticId: { userId, cosmeticId } },
    });
    if (existingOwnership) {
      return { error: "Você já possui este item." };
    }

    if (user.balancePremium < cosmetic.price) {
      return { error: "Saldo de Patinhas Premium insuficiente." };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balancePremium: { decrement: cosmetic.price } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: -cosmetic.price,
          currency: "PREMIUM",
          type: "SPEND",
          description: `Compra do cosmético: ${cosmetic.name}`,
          metadata: { cosmeticId: cosmetic.id }
        },
      }),
      prisma.userCosmetic.create({
        data: { userId, cosmeticId },
      }),
    ]);

    revalidatePath("/shop/cosmetics");
    revalidatePath("/profile");
    revalidatePath("/");
    
    return { success: `'${cosmetic.name}' foi adicionado ao seu inventário!` };

  } catch (error) {
    return { error: "Ocorreu um erro durante a compra." };
  }
}

/**
 * Server Action para um usuário equipar um cosmético do seu inventário.
 */
export async function equipCosmetic(
  prevState: CosmeticState, 
  formData: FormData
): Promise<CosmeticState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Login necessário." };
  }

  const cosmeticId = formData.get("cosmeticId") as string;
  const cosmeticType = formData.get("cosmeticType") as CosmeticType;
  
  if (!cosmeticId || !cosmeticType) return { error: "Dados inválidos." };

  const userId = session.user.id;

  try {
    const ownership = await prisma.userCosmetic.findUnique({
      where: { userId_cosmeticId: { userId, cosmeticId } },
    });
    if (!ownership) {
      return { error: "Você não possui este item para equipar." };
    }

    let fieldToUpdate: string;
    switch (cosmeticType) {
      case "AVATAR_FRAME":
        fieldToUpdate = "equippedAvatarFrameId";
        break;
      case "COMMENT_BACKGROUND":
        fieldToUpdate = "equippedCommentBackgroundId";
        break;
      default:
        return { error: "Tipo de cosmético desconhecido." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        [fieldToUpdate]: cosmeticId,
      },
    });

    revalidatePath("/profile");
    return { success: "Item equipado com sucesso!" };

  } catch (error) {
    return { error: "Ocorreu um erro ao equipar o item." };
  }
}
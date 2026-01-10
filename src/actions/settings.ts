"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth, signOut } from "@/lib/auth"; // Adicionado para a exclusão de conta

// --- PARTE 1: CONFIGURAÇÕES GLOBAIS (ADMIN) ---

// Tipagem do Estado de Retorno
type SettingsState = {
  error?: string;
  success?: string;
} | null;

export async function updateSettings(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  // Tipagem correta: array de Promises que retornam o modelo Setting
  const settingsToUpdate: Prisma.Prisma__SettingClient<{
    key: string;
    value: string;
  }>[] = [];

  // O FormData do Switch envia "on" quando marcado, mas não envia nada quando desmarcado.
  const maintenanceMode = formData.get("maintenanceMode") === "on" ? "true" : "false";

  // Upsert para o modo manutenção
  settingsToUpdate.push(
    prisma.setting.upsert({
      where: { key: 'maintenanceMode' },
      create: { key: 'maintenanceMode', value: maintenanceMode },
      update: { value: maintenanceMode },
    })
  );

  // Upsert para os outros campos
  for (const [key, value] of formData.entries()) {
    if (key !== "maintenanceMode") {
      settingsToUpdate.push(
        prisma.setting.upsert({
          where: { key },
          create: { key, value: value as string },
          update: { value: value as string },
        })
      );
    }
  }

  try {
    await prisma.$transaction(settingsToUpdate);
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return { error: "Erro ao salvar configurações no banco de dados." };
  }

  revalidatePath("/admin/settings");
  return { success: "Configurações salvas com sucesso!" };
}

// --- PARTE 2: CONFIGURAÇÕES DA CONTA DO USUÁRIO (LGPD) ---

export async function deleteAccount(
  prevState?: any, 
  formData?: FormData
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Não autorizado." };
  }

  try {
    const anonymousId = `deleted_${session.user.id.slice(0, 8)}`;
    
    // Anonimiza os dados no banco
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: "Usuário Excluído",
        username: anonymousId,
        email: `${anonymousId}@deleted.gatocomics.com.br`,
        password: "",
        image: null,
        dateOfBirth: new Date(0),
        emailVerified: null,
        equippedAvatarFrameId: null,
        equippedProfileBannerId: null,
        equippedCommentBackgroundId: null,
      }
    });

    // Tenta deslogar e redirecionar
    await signOut({ redirectTo: "/" });
    
  } catch (error) {
    // --- CORREÇÃO AQUI ---
    // Verifica se o erro é apenas o Next.js tentando redirecionar
    if ((error as Error).message === "NEXT_REDIRECT" || (error as any).digest?.startsWith("NEXT_REDIRECT")) {
        throw error; // Lança o erro para o Next.js fazer o redirect
    }

    console.error("Erro ao excluir conta:", error);
    return { error: "Erro ao processar exclusão. Tente novamente." };
  }
}
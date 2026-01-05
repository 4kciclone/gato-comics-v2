"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tipagem do Estado de Retorno
type SettingsState = {
  error?: string;
  success?: string;
} | null;

export async function updateSettings(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const settingsToUpdate = [];

  // O FormData do Switch envia "on" quando marcado, mas não envia nada quando desmarcado.
  // Precisamos garantir que o valor "false" seja salvo.
  const maintenanceMode = formData.get("maintenanceMode") === "on" ? "true" : "false";

  // Upsert para o modo manutenção
  settingsToUpdate.push(
    prisma.setting.upsert({
      where: { key: 'maintenanceMode' },
      create: { key: 'maintenanceMode', value: maintenanceMode },
      update: { value: maintenanceMode },
    })
  );

  // Upsert para os outros campos (ex: siteTitle)
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
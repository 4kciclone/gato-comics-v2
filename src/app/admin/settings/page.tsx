import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany();
  // Converte o array em um objeto para fácil acesso: { key: value }
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Configurações</h1>
        <p className="text-zinc-400">Controle configurações globais da plataforma.</p>
      </div>

      {/* Renderiza o Client Component com os dados iniciais */}
      <SettingsForm initialSettings={settingsMap} />
    </div>
  );
}
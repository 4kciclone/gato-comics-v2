"use client";

import { useActionState } from "react";
import { updateSettings } from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

// O formulário agora recebe os dados iniciais como props
interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettings, null);

  // Efeito para mostrar notificações (toasts)
  useEffect(() => {
    if (state?.success) {
      toast.success("Sucesso!", { description: state.success });
    }
    if (state?.error) {
      toast.error("Erro!", { description: state.error });
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="bg-[#111] border-[#27272a]">
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Mudanças aqui afetam o site inteiro. Use com cuidado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode" className="text-base font-medium text-white">
                Modo Manutenção
              </Label>
              <p className="text-sm text-zinc-500">
                Se ativo, apenas Admins poderão acessar o site.
              </p>
            </div>
            <Switch
              id="maintenanceMode"
              name="maintenanceMode"
              // Usamos 'on'/'off' para compatibilidade com FormData
              value={initialSettings.maintenanceMode === 'true' ? 'on' : 'off'}
              defaultChecked={initialSettings.maintenanceMode === 'true'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteTitle">Título do Site</Label>
            <Input 
              id="siteTitle"
              name="siteTitle"
              defaultValue={initialSettings.siteTitle || 'Gato Comics'}
              className="bg-[#050505] border-[#27272a]"
            />
          </div>

          <div className="flex justify-end pt-4">
             <Button type="submit" disabled={isPending} className="bg-[#FFD700] text-black font-bold">
               {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
               {isPending ? "Salvando..." : "Salvar Alterações"}
             </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
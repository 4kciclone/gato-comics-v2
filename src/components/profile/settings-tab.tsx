"use client";

import { useActionState, useEffect } from "react";
import { updateProfileSettings, changeNickname } from "@/actions/profile-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Lock, UserCog, FileText, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { subDays } from "date-fns";
import { Separator } from "@/components/ui/separator";
// Importamos o formulário de exclusão que já criamos anteriormente
import { DeleteAccountForm } from "@/components/settings/delete-account-form";

export function SettingsTab({ user }: { user: any }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileSettings, null);
  const [nickState, nickAction, nickPending] = useActionState(changeNickname, null);

  useEffect(() => {
    if (profileState?.success) toast.success(profileState.success);
    if (profileState?.error) toast.error(profileState.error);
    if (nickState?.success) toast.success(nickState.success);
    if (nickState?.error) toast.error(nickState.error);
  }, [profileState, nickState]);

  // Calcula dias restantes para trocar nick
  const daysSinceChange = user.lastNicknameChange 
    ? Math.floor((new Date().getTime() - new Date(user.lastNicknameChange).getTime()) / (1000 * 60 * 60 * 24)) 
    : 999;
  const canChangeFree = daysSinceChange >= 90;

  // Formata data de nascimento para exibição
  const birthDateFormatted = user.dateOfBirth 
    ? new Date(user.dateOfBirth).toLocaleDateString('pt-BR') 
    : "Não informado";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 1. PERFIL PÚBLICO (Bio, Local, Privacidade) */}
        <div className="space-y-8">
            <Card className="bg-[#111] border-zinc-800 h-full">
                <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCog className="w-5 h-5 text-[#FFD700]" /> Perfil Público</CardTitle>
                <CardDescription>Informações visíveis para a comunidade.</CardDescription>
                </CardHeader>
                <CardContent>
                <form action={profileAction} className="space-y-4">
                    <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea name="bio" defaultValue={user.bio || ""} className="bg-zinc-950 border-zinc-800 min-h-[100px]" placeholder="Conte sobre você..." />
                    </div>
                    
                    <div className="space-y-2">
                    <Label>Localização</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                        <Input name="location" defaultValue={user.location || ""} className="bg-zinc-950 border-zinc-800 pl-9" placeholder="Ex: São Paulo, SP" />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label>Privacidade do Histórico</Label>
                    <Select name="privacySettings" defaultValue={user.privacySettings || "PUBLIC"}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="PUBLIC">Público (Todos veem)</SelectItem>
                        <SelectItem value="FOLLOWING">Somente quem eu sigo</SelectItem>
                        <SelectItem value="PRIVATE">Privado (Ninguém vê)</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>

                    <Button disabled={profilePending} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white mt-2">
                    {profilePending ? <Loader2 className="animate-spin w-4 h-4"/> : "Salvar Alterações"}
                    </Button>
                </form>
                </CardContent>
            </Card>
        </div>

        {/* 2. CONTA & DADOS PESSOAIS */}
        <div className="space-y-8">
            {/* Nickname */}
            <Card className="bg-[#111] border-zinc-800">
                <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-[#FFD700]" /> Conta</CardTitle>
                <CardDescription>Gerencie sua identidade.</CardDescription>
                </CardHeader>
                <CardContent>
                <form action={nickAction} className="space-y-4">
                    <div className="space-y-2">
                    <Label>Nome de Exibição (Nickname)</Label>
                    <Input name="nickname" defaultValue={user.name} className="bg-zinc-950 border-zinc-800" />
                    </div>
                    
                    {!canChangeFree && (
                    <div className="text-xs text-yellow-500 bg-yellow-950/20 p-2 rounded border border-yellow-900/50">
                        Troca gratuita disponível em {90 - daysSinceChange} dias. 
                        <br/>Custo imediato: <strong>500 Patinhas Premium</strong>.
                    </div>
                    )}

                    <Button disabled={nickPending} className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
                    {nickPending ? <Loader2 className="animate-spin w-4 h-4"/> : canChangeFree ? "Alterar Gratuitamente" : "Pagar para Alterar"}
                    </Button>
                </form>
                </CardContent>
            </Card>

            {/* Dados LGPD (Leitura) */}
            <Card className="bg-[#111] border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-zinc-300">
                        <FileText className="w-4 h-4" /> Dados Pessoais (LGPD)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-zinc-500 uppercase">Username (Login)</Label>
                        <Input disabled value={user.username} className="bg-zinc-950/50 border-zinc-800 text-zinc-400" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-zinc-500 uppercase">Email Vinculado</Label>
                        <Input disabled value={user.email} className="bg-zinc-950/50 border-zinc-800 text-zinc-400" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-zinc-500 uppercase">Data de Nascimento</Label>
                        <Input disabled value={birthDateFormatted} className="bg-zinc-950/50 border-zinc-800 text-zinc-400" />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* 3. ZONA DE PERIGO */}
      <Card className="border-red-900/30 bg-red-950/10">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Zona de Perigo
          </CardTitle>
          <CardDescription className="text-red-200/60">
            Ações irreversíveis. Ao excluir sua conta, seus dados pessoais são anonimizados permanentemente.
            Seu histórico de compras será mantido de forma anônima para fins fiscais por 5 anos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-zinc-400">
                <p>Você perderá acesso imediato a:</p>
                <ul className="list-disc list-inside mt-1 text-xs text-zinc-500">
                    <li>Todas as Patinhas (Premium e Lite)</li>
                    <li>Obras desbloqueadas</li>
                    <li>Histórico de leitura e comentários</li>
                </ul>
            </div>
            
            {/* Componente de Exclusão */}
            <DeleteAccountForm />
            
        </CardContent>
      </Card>

    </div>
  );
}
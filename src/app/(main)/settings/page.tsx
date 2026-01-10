import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// Remova o import direto do deleteAccount e Button
// Importe o novo componente:
import { DeleteAccountForm } from "@/components/settings/delete-account-form"; 

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return null;

  return (
    <div className="container max-w-4xl mx-auto py-10 space-y-8 px-4 text-white">
      <div>
        <h1 className="text-3xl font-bold text-[#FFD700]">Configurações</h1>
        <p className="text-zinc-400">Gerencie seus dados e privacidade.</p>
      </div>

      <Separator className="bg-[#27272a]" />

      {/* DADOS (Visualização) */}
      <Card className="bg-[#111111] border-[#27272a] text-white">
        <CardHeader>
          <CardTitle>Seus Dados (LGPD)</CardTitle>
          <CardDescription>Estes são os dados pessoais que temos sobre você.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <Label>Username</Label>
                <Input disabled value={user.username} className="bg-[#050505] border-[#27272a] text-zinc-300" />
            </div>
            <div className="space-y-2">
                <Label>Email</Label>
                <Input disabled value={user.email} className="bg-[#050505] border-[#27272a] text-zinc-300" />
            </div>
            <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input 
                  disabled 
                  value={new Date(user.dateOfBirth).toLocaleDateString('pt-BR')} 
                  className="bg-[#050505] border-[#27272a] text-zinc-300" 
                />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ZONA DE PERIGO REAL */}
      <Card className="border-red-900/50 bg-red-950/10 text-white">
        <CardHeader>
          <CardTitle className="text-red-500">Zona de Perigo</CardTitle>
          <CardDescription className="text-red-200/60">
            Ações irreversíveis. Ao excluir, seus dados pessoais são anonimizados. Seu histórico de compras é mantido de forma anônima para fins fiscais.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <p className="font-medium text-red-400">Excluir Conta</p>
                <p className="text-sm text-red-400/60">Você perderá o acesso às suas Patinhas e biblioteca.</p>
            </div>
            
            {/* USANDO O NOVO COMPONENTE CLIENTE AQUI */}
            <DeleteAccountForm />

        </CardContent>
      </Card>
    </div>
  );
}
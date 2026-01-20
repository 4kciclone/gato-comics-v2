"use client"; // Usamos Client Component para o formulário interativo

import { useActionState } from "react";
import { createCosmetic } from "@/actions/cosmetics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Pré-requisito: npx shadcn@latest add select

export default function CosmeticsAdminPage() {
  const [state, formAction, isPending] = useActionState(createCosmetic, null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Gerenciar Cosméticos</h1>
        <p className="text-zinc-400">Adicione molduras, fundos e outros itens na loja.</p>
      </div>

      <Card className="bg-[#111111] border-[#27272a] text-white">
        <CardHeader>
          <CardTitle>Novo Cosmético</CardTitle>
          <CardDescription>
            Este item aparecerá na Loja de Cosméticos para os usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Item</Label>
                <Input id="name" name="name" placeholder="Ex: Moldura de Fogo" className="bg-[#050505] border-[#27272a]" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (Patinhas Premium)</Label>
                <Input id="price" name="price" type="number" placeholder="Ex: 250" className="bg-[#050505] border-[#27272a]" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" name="description" placeholder="Uma moldura flamejante para perfis lendários." className="bg-[#050505] border-[#27272a]" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem/GIF</Label>
              <Input id="imageUrl" name="imageUrl" placeholder="https://... (link do R2)" className="bg-[#050505] border-[#27272a]" required />
              <p className="text-xs text-zinc-500">Faça upload para o R2 e cole o link público aqui.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="type" required>
                  <SelectTrigger className="bg-[#050505] border-[#27272a]">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#27272a] text-white">
                    <SelectItem value="AVATAR_FRAME">Moldura de Avatar</SelectItem>
                    <SelectItem value="COMMENT_BACKGROUND">Banner de Comentário</SelectItem>
                    <SelectItem value="USERNAME_COLOR">Cor de Nome</SelectItem>
                    <SelectItem value="PROFILE_BANNER">fundo de Perfil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Raridade</Label>
                <Select name="rarity" required>
                  <SelectTrigger className="bg-[#050505] border-[#27272a]">
                    <SelectValue placeholder="Selecione a raridade..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#27272a] text-white">
                    <SelectItem value="COMMON">Comum</SelectItem>
                    <SelectItem value="RARE">Raro</SelectItem>
                    <SelectItem value="EPIC">Épico</SelectItem>
                    <SelectItem value="LEGENDARY">Lendário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Feedback */}
            {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
            {state?.success && <p className="text-green-400 text-sm">{state.success}</p>}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="bg-[#FFD700] text-black font-bold">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Aqui viria a lista de cosméticos existentes, mas vamos focar na criação primeiro */}
    </div>
  );
}
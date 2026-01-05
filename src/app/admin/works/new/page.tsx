'use client';

import { useActionState } from "react";
import { createWork, type WorkState } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

// Estado inicial tipado corretamente
const initialState: WorkState = {
  message: null,
  errors: {},
};

export default function NewWorkPage() {
  const [state, formAction, isPending] = useActionState(createWork, initialState);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Nova Obra</h1>
        <p className="text-zinc-400">Adicione um novo título ao catálogo.</p>
      </div>

      <form action={formAction}>
        <Card className="bg-[#111111] border-[#27272a] text-white">
          <CardHeader>
            <CardTitle>Detalhes da Obra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Título e Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título Oficial</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="Ex: Solo Leveling" 
                  className="bg-[#050505] border-[#27272a] focus-visible:ring-[#FFD700]"
                />
                {state.errors?.title && <p className="text-red-500 text-xs">{state.errors.title}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input 
                  id="slug" 
                  name="slug" 
                  placeholder="ex: solo-leveling" 
                  className="bg-[#050505] border-[#27272a] focus-visible:ring-[#FFD700]"
                />
                {state.errors?.slug && <p className="text-red-500 text-xs">{state.errors.slug}</p>}
              </div>
            </div>

            {/* Sinopse */}
            <div className="space-y-2">
              <Label htmlFor="synopsis">Sinopse</Label>
              <Textarea 
                id="synopsis" 
                name="synopsis" 
                placeholder="Uma breve descrição da história..." 
                className="bg-[#050505] border-[#27272a] focus-visible:ring-[#FFD700] min-h-32"
              />
              {state.errors?.synopsis && <p className="text-red-500 text-xs">{state.errors.synopsis}</p>}
            </div>

            {/* Créditos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input 
                  id="author" 
                  name="author" 
                  className="bg-[#050505] border-[#27272a]"
                />
                {state.errors?.author && <p className="text-red-500 text-xs">{state.errors.author}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist">Artista (Opcional)</Label>
                <Input 
                  id="artist" 
                  name="artist" 
                  className="bg-[#050505] border-[#27272a]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio">Estúdio</Label>
                <Input 
                  id="studio" 
                  name="studio" 
                  placeholder="Ex: Redice Studio"
                  className="bg-[#050505] border-[#27272a]"
                />
              </div>
            </div>

            {/* Metadados Extras */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genres">Gêneros (Separados por vírgula)</Label>
                <Input 
                  id="genres" 
                  name="genres" 
                  placeholder="Ação, Fantasia, Isekai"
                  className="bg-[#050505] border-[#27272a]"
                />
                {state.errors?.genres && <p className="text-red-500 text-xs">{state.errors.genres}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="coverUrl">URL da Capa (Temporário)</Label>
                <Input 
                  id="coverUrl" 
                  name="coverUrl" 
                  placeholder="https://..."
                  className="bg-[#050505] border-[#27272a]"
                />
                <p className="text-xs text-zinc-500">Cole um link direto de imagem.</p>
                {state.errors?.coverUrl && <p className="text-red-500 text-xs">{state.errors.coverUrl}</p>}
              </div>
            </div>

            {/* Checkbox Adulto */}
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="isAdult" 
                name="isAdult" 
                className="h-4 w-4 rounded border-zinc-700 bg-[#050505] text-[#FFD700] focus:ring-[#FFD700]" 
              />
              <Label htmlFor="isAdult" className="text-zinc-400 cursor-pointer">Conteúdo Adulto (+18)</Label>
            </div>

            {/* Feedback Global */}
            {state.message && (
               <div className={`p-3 rounded text-sm flex items-center ${state.message.includes('sucesso') ? 'bg-green-900/20 text-green-400 border border-green-900' : 'bg-red-900/20 text-red-400 border border-red-900'}`}>
                 {state.message}
               </div>
            )}

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold min-w-32"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Obra
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
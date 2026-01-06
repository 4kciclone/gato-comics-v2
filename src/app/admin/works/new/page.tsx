"use client";

import { useActionState, useState, useEffect, useRef } from "react"; // useRef importado corretamente
import { createWork, type WorkState } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const initialState: WorkState = {
  message: null,
  success: null,
  errors: {},
};

export default function NewWorkPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createWork, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  
  // CORREÇÃO: useRef inicializado da forma correta
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Sucesso!", { description: state.success });
      router.push("/admin/works");
    }
    if (state?.message) {
      toast.error("Erro!", { description: state.message });
    }
  }, [state, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClearPreview = () => {
    setPreview(null);
    // CORREÇÃO: Acessamos '.current' para interagir com o elemento do DOM
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Nova Obra</h1>
        <p className="text-zinc-400">Adicione um novo título ao catálogo da Gato Comics.</p>
      </div>

      <form action={formAction}>
        <Card className="bg-[#111111] border-[#27272a] text-white">
          <CardHeader><CardTitle>Detalhes da Obra</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="title">Título Oficial</Label><Input id="title" name="title" className="bg-zinc-900" placeholder="Ex: Solo Leveling" required /><p className="text-red-500 text-xs">{state?.errors?.title}</p></div>
              <div className="space-y-2"><Label htmlFor="slug">Slug (URL)</Label><Input id="slug" name="slug" className="bg-zinc-900" placeholder="ex: solo-leveling" required /><p className="text-red-500 text-xs">{state?.errors?.slug}</p></div>
            </div>

            <div className="space-y-2"><Label htmlFor="synopsis">Sinopse</Label><Textarea id="synopsis" name="synopsis" className="bg-zinc-900" placeholder="Uma breve descrição da história..." minLength={10} required /><p className="text-red-500 text-xs">{state?.errors?.synopsis}</p></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label htmlFor="author">Autor</Label><Input id="author" name="author" className="bg-zinc-900" required /></div>
              <div className="space-y-2"><Label htmlFor="artist">Artista (Opcional)</Label><Input id="artist" name="artist" className="bg-zinc-900"/></div>
              <div className="space-y-2"><Label htmlFor="studio">Estúdio</Label><Input id="studio" name="studio" className="bg-zinc-900" placeholder="Ex: Redice Studio" /></div>
            </div>

            <div className="space-y-2"><Label htmlFor="genres">Gêneros (Separados por vírgula)</Label><Input id="genres" name="genres" className="bg-zinc-900" placeholder="Ação, Fantasia, Isekai" required /></div>

            {/* ÁREA DE UPLOAD DA CAPA */}
            <div className="space-y-2">
              <Label>Capa da Obra (PNG, JPG, WEBP)</Label>
              {/* Tailwind v4 fix: aspect-2/3 */}
              <div className={cn(
                "relative aspect-2/3 w-full max-w-sm rounded-lg border-2 border-dashed border-zinc-700 bg-[#0a0a0a] flex items-center justify-center transition-colors",
                !preview && "hover:border-[#FFD700]"
              )}>
                <input
                  type="file"
                  name="coverImage"
                  id="coverImage"
                  accept="image/png, image/jpeg, image/webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  required
                />
                {preview ? (
                  <>
                    <img src={preview} alt="Prévia da capa" className="h-full w-full object-cover rounded-md" />
                    <Button type="button" onClick={handleClearPreview} size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 h-8 w-8 rounded-full text-white z-20">
                      <X className="w-4 h-4"/>
                    </Button>
                  </>
                ) : (
                  <Label htmlFor="coverImage" className="cursor-pointer text-center text-zinc-500 flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 mb-2" />
                    <span>Clique ou arraste a imagem aqui</span>
                  </Label>
                )}
              </div>
              <p className="text-red-500 text-xs">{state?.errors?.coverImage}</p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" id="isAdult" name="isAdult" className="h-4 w-4 rounded border-zinc-700 bg-[#050505] text-[#FFD700] focus:ring-[#FFD700]" />
              <Label htmlFor="isAdult" className="text-zinc-400 cursor-pointer">Conteúdo Adulto (+18)</Label>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold min-w-32">
                {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Criar Obra</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
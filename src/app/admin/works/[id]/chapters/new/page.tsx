'use client';

import { useActionState, useState } from "react";
import { use } from "react"; // React 19 unwrap
import { createChapter } from "@/actions/chapters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UploadCloud, FileArchive } from "lucide-react";

// Estado inicial simples
const initialState = {
  message: null as string | null,
};

export default function NewChapterPage({ params }: { params: Promise<{ id: string }> }) {
  // Desembrulha params com React.use() (Padrão Next 15)
  const { id: workId } = use(params);
  
  const [state, formAction, isPending] = useActionState(createChapter, initialState);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Novo Capítulo</h1>
        <p className="text-zinc-400">Upload em massa via arquivo .zip</p>
      </div>

      <form action={formAction}>
        {/* ID Oculto para a Action saber qual obra é */}
        <input type="hidden" name="workId" value={workId} />

        <Card className="bg-[#111111] border-[#27272a] text-white">
          <CardHeader>
            <CardTitle>Configurações do Capítulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Título e Número */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número (Ordem)</Label>
                <Input name="number" type="number" step="0.1" placeholder="Ex: 1" className="bg-[#050505] border-[#27272a]" required />
              </div>
              <div className="space-y-2">
                <Label>Título do Capítulo</Label>
                <Input name="title" placeholder="Ex: O Retorno" className="bg-[#050505] border-[#27272a]" required />
              </div>
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#FFD700]">Preço Premium (Patinhas)</Label>
                <Input name="pricePremium" type="number" defaultValue="3" className="bg-[#050505] border-[#27272a]" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Preço Lite (Aluguel)</Label>
                <Input name="priceLite" type="number" defaultValue="10" className="bg-[#050505] border-[#27272a]" />
              </div>
            </div>

            {/* Checkbox Grátis */}
            <div className="flex items-center space-x-2">
               <input type="checkbox" id="isFree" name="isFree" className="rounded border-zinc-700 bg-[#050505]" />
               <Label htmlFor="isFree">Capítulo Gratuito (Ignora preços)</Label>
            </div>

            {/* Área de Upload */}
            <div className="space-y-2">
              <Label>Arquivo de Imagens (.zip)</Label>
              <div className="border-2 border-dashed border-[#27272a] hover:border-[#FFD700] rounded-lg p-8 transition-colors text-center relative bg-[#050505]/50">
                <input 
                  type="file" 
                  name="file" 
                  accept=".zip" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                  required
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  {fileName ? (
                    <>
                      <FileArchive className="w-10 h-10 text-[#FFD700]" />
                      <span className="text-white font-medium">{fileName}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-zinc-500" />
                      <span className="text-zinc-400">Arraste seu ZIP aqui ou clique</span>
                      <span className="text-xs text-zinc-600">Máx: 50MB. Apenas imagens numeradas.</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mensagem de Erro/Sucesso */}
            {state?.message && (
               <div className="p-3 rounded bg-red-900/20 text-red-400 border border-red-900 text-sm">
                 {state.message}
               </div>
            )}

            <Button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold h-12 text-lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando para Nuvem...
                  </>
                ) : (
                  "Publicar Capítulo"
                )}
            </Button>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
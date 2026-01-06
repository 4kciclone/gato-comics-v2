"use client";

import Link from "next/link";
import { useActionState } from "react";
import { unlockChapter } from "@/actions/unlock";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Coins, AlertCircle } from "lucide-react";

interface PaywallProps {
  chapterId: string;
  chapterTitle: string;
  workSlug: string;
  chapterSlug: string;
  priceLite: number;
  pricePremium: number;
}

export function Paywall({
  chapterId,
  chapterTitle,
  workSlug,
  chapterSlug,
  priceLite,
  pricePremium,
}: PaywallProps) {
  const [state, formAction, isPending] = useActionState(unlockChapter, null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-6 text-center animate-in fade-in duration-500">
      
      <div className="bg-[#111111] p-8 rounded-2xl border border-[#27272a] max-w-md w-full shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-[#FFD700]/10 rounded-full">
            <Lock className="w-10 h-10 text-[#FFD700]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Capítulo Bloqueado</h1>
        <p className="text-zinc-400 mb-8">
          Para ler <strong className="text-white">{chapterTitle}</strong>, escolha uma opção de desbloqueio.
        </p>

        {/* Mensagem de Erro */}
        {state?.error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-900 rounded-lg flex items-center gap-2 text-red-400 text-sm text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {state.error}
          </div>
        )}

        <div className="space-y-3">
          {/* FORMULÁRIO ALUGUEL (LITE) */}
          <form action={formAction}>
            <input type="hidden" name="chapterId" value={chapterId} />
            <input type="hidden" name="workSlug" value={workSlug} />
            <input type="hidden" name="chapterSlug" value={chapterSlug} />
            <input type="hidden" name="type" value="RENTAL" />
            
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-14 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] hover:border-[#FFD700] text-white flex justify-between items-center px-4 group"
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm">Alugar (72h)</span>
                <span className="text-xs text-zinc-500">Usa Patinhas Lite</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 group-hover:text-[#FFD700]">
                {isPending ? <Loader2 className="animate-spin w-4 h-4"/> : <Coins className="w-4 h-4"/>}
                <span className="font-bold">{priceLite}</span>
              </div>
            </Button>
          </form>

          {/* FORMULÁRIO COMPRA (PREMIUM) */}
          <form action={formAction}>
            <input type="hidden" name="chapterId" value={chapterId} />
            <input type="hidden" name="workSlug" value={workSlug} />
            <input type="hidden" name="chapterSlug" value={chapterSlug} />
            <input type="hidden" name="type" value="PERMANENT" />

            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-14 bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold flex justify-between items-center px-4"
            >
              <div className="flex flex-col items-start">
                <span className="text-sm">Desbloquear</span>
                <span className="text-xs opacity-70">Nunca expira</span>
              </div>
              <div className="flex items-center gap-2">
                 {isPending ? <Loader2 className="animate-spin w-4 h-4"/> : <Coins className="w-4 h-4"/>}
                 <span>{pricePremium}</span>
              </div>
            </Button>
          </form>
        </div>

        <div className="mt-6 pt-6 border-t border-[#27272a]">
           <Link href="/shop">
             <Button variant="link" className="text-zinc-500 hover:text-[#FFD700] text-xs">
               Não tem saldo suficiente? Ir para a Loja
             </Button>
           </Link>
           <div className="mt-2">
             <Link href={`/obra/${workSlug}`}>
               <Button variant="ghost" className="w-full text-zinc-400">Voltar para a Obra</Button>
             </Link>
           </div>
        </div>

      </div>
    </div>
  );
}
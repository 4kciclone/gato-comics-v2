"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { unlockChapter } from "@/actions/unlock";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Coins, AlertCircle, ShoppingCart } from "lucide-react";

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

  // Efeito para exibir toasts de feedback
  useEffect(() => {
    if (state?.error) {
      toast.error("Erro ao Desbloquear", { 
        description: state.error,
        action: { label: "Ir para Loja", onClick: () => window.location.href = '/shop' }
      });
    }
    // O sucesso já é tratado pela recarga da página, não precisa de toast
  }, [state]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 text-center" style={{
      backgroundImage: `radial-gradient(circle at center, rgba(138, 43, 226, 0.1), transparent 70%)`
    }}>
      <div className="bg-[#111111]/80 backdrop-blur-xl p-8 rounded-2xl border border-zinc-800 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-[#FFD700]/10 rounded-full border-2 border-[#FFD700]/20">
            <Lock className="w-10 h-10 text-[#FFD700]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Capítulo Bloqueado</h1>
        <p className="text-zinc-400 mb-8">
          Para ler <strong className="text-white">{chapterTitle}</strong>, escolha uma opção de desbloqueio.
        </p>

        <div className="space-y-3">
          {/* BOTÃO ALUGAR (LITE) */}
          <form action={formAction}>
            <input type="hidden" name="chapterId" value={chapterId} />
            <input type="hidden" name="workSlug" value={workSlug} />
            <input type="hidden" name="chapterSlug" value={chapterSlug} />
            <input type="hidden" name="type" value="RENTAL" />
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-16 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white flex justify-between items-center px-6 group rounded-xl"
            >
              <div className="text-left">
                <span className="font-bold text-base">Alugar (72h)</span>
                <p className="text-xs text-zinc-400">Usa Patinhas Lite</p>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 font-bold">
                {isPending ? <Loader2 className="animate-spin w-5 h-5"/> : <Coins className="w-5 h-5 text-zinc-500 group-hover:text-white"/>}
                <span>{priceLite}</span>
              </div>
            </Button>
          </form>

          {/* BOTÃO COMPRAR (PREMIUM) */}
          <form action={formAction}>
            <input type="hidden" name="chapterId" value={chapterId} />
            <input type="hidden" name="workSlug" value={workSlug} />
            <input type="hidden" name="chapterSlug" value={chapterSlug} />
            <input type="hidden" name="type" value="PERMANENT" />
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-16 bg-[#FFD700] text-black hover:bg-yellow-300 font-bold flex justify-between items-center px-6 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)]"
            >
              <div className="text-left">
                <span className="text-base">Desbloquear (Nunca Expira)</span>
                <p className="text-xs text-black/60">Usa Patinhas Premium</p>
              </div>
              <div className="flex items-center gap-2">
                 {isPending ? <Loader2 className="animate-spin w-5 h-5"/> : <Coins className="w-5 h-5"/>}
                 <span>{pricePremium}</span>
              </div>
            </Button>
          </form>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
           <Link href="/shop">
             <Button variant="link" className="text-zinc-500 hover:text-[#FFD700] text-xs h-auto p-0">
               <ShoppingCart className="w-3 h-3 mr-1.5" /> Não tem saldo suficiente? Ir para a Loja
             </Button>
           </Link>
           <Link href={`/obra/${workSlug}`}>
             <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">Voltar para a Obra</Button>
           </Link>
        </div>

      </div>
    </div>
  );
}
"use client";

import { useState, useTransition } from "react";
import { unlockChapter } from "@/actions/commerce";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Loader2, Lock, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface UnlockViewProps {
  chapterId: string;
  priceLite: number;
  pricePremium: number;
  userBalance: { lite: number; premium: number };
  workSlug: string;
}

export function UnlockView({ chapterId, priceLite, pricePremium, userBalance, workSlug }: UnlockViewProps) {
  const [isPending, startTransition] = useTransition();

  const handleUnlock = (method: "LITE" | "PREMIUM") => {
    startTransition(async () => {
      const res = await unlockChapter(chapterId, method);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Boa leitura!");
        // O router refresh é automático pelo Server Action revalidatePath
      }
    });
  };

  const canAffordLite = userBalance.lite >= priceLite;
  const canAffordPremium = userBalance.premium >= pricePremium;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-[#111] p-8 rounded-2xl border border-[#27272a] max-w-md w-full shadow-2xl">
        <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6 text-[#FFD700]">
            <Lock className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Capítulo Bloqueado</h1>
        <p className="text-zinc-400 mb-8">Escolha como deseja liberar este capítulo:</p>

        <div className="space-y-4">
            {/* OPÇÃO 1: LITE (ALUGUEL) */}
            <div className={`p-4 rounded-xl border transition-all ${canAffordLite ? 'border-purple-500/30 bg-purple-500/5' : 'border-zinc-800 bg-zinc-900/50 opacity-50'}`}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <CurrencyIcon type="lite" size={16} />
                        <span className="text-white font-bold">Alugar (72h)</span>
                    </div>
                    <span className="text-zinc-400 text-sm">{priceLite} Patinhas</span>
                </div>
                <Button 
                    onClick={() => handleUnlock("LITE")} 
                    disabled={!canAffordLite || isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                    {isPending ? <Loader2 className="animate-spin w-4 h-4"/> : canAffordLite ? "Usar Saldo Lite" : "Saldo Insuficiente"}
                </Button>
            </div>

            {/* OPÇÃO 2: PREMIUM (PERMANENTE) */}
            <div className={`p-4 rounded-xl border transition-all ${canAffordPremium ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-zinc-800 bg-zinc-900/50 opacity-50'}`}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <CurrencyIcon type="premium" size={16} />
                        <span className="text-white font-bold">Desbloquear (Vitalício)</span>
                    </div>
                    <span className="text-zinc-400 text-sm">{pricePremium} Patinhas</span>
                </div>
                <Button 
                    onClick={() => handleUnlock("PREMIUM")} 
                    disabled={!canAffordPremium || isPending}
                    className="w-full bg-[#FFD700] hover:bg-yellow-400 text-black font-bold"
                >
                    {isPending ? <Loader2 className="animate-spin w-4 h-4"/> : canAffordPremium ? "Usar Saldo Premium" : "Saldo Insuficiente"}
                </Button>
            </div>
        </div>

        {(!canAffordLite && !canAffordPremium) && (
             <div className="mt-6 pt-6 border-t border-[#27272a]">
                <p className="text-sm text-zinc-500 mb-3">Você precisa de mais patinhas.</p>
                <Link href="/shop">
                    <Button variant="outline" className="w-full border-zinc-700">Ir para a Loja</Button>
                </Link>
             </div>
        )}

        <div className="mt-6">
            <Link href={`/obra/${workSlug}`} className="text-sm text-zinc-500 hover:text-white transition-colors">
                Voltar para a obra
            </Link>
        </div>
      </div>
    </div>
  );
}
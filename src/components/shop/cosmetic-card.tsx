"use client";

import { useActionState } from "react";
import { buyCosmetic } from "@/actions/cosmetics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Coins, Loader2, Lock, Check } from "lucide-react";
import { Button } from "../ui/button";

interface Cosmetic {
  id: string;
  name: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  price: number;
  imageUrl: string;
}

interface CosmeticCardProps {
  cosmetic: Cosmetic;
  userBalance: number;
  isOwned: boolean;
  userAvatar: string;
}

const rarityStyles = {
  COMMON: { bg: "bg-zinc-700", text: "text-zinc-200", border: "border-zinc-700", glow: "shadow-zinc-500/20" },
  RARE: { bg: "bg-blue-600", text: "text-white", border: "border-blue-500", glow: "shadow-blue-500/30" },
  EPIC: { bg: "bg-purple-600", text: "text-white", border: "border-purple-500", glow: "shadow-purple-500/40" },
  LEGENDARY: { bg: "bg-yellow-500", text: "text-black", border: "border-yellow-400", glow: "shadow-yellow-400/50" },
};

export function CosmeticCard({ cosmetic, userBalance, isOwned, userAvatar }: CosmeticCardProps) {
  const [state, formAction, isPending] = useActionState(buyCosmetic, null);

  // Exibe toast de feedback
  if (state?.error) toast.error(state.error);
  if (state?.success) toast.success(state.success);

  const styles = rarityStyles[cosmetic.rarity];
  const hasSufficientBalance = userBalance >= cosmetic.price;

  return (
    <div className={cn(
      "group relative flex flex-col rounded-2xl border bg-[#0a0a0a] transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 shadow-xl",
      isOwned ? "border-green-700/50" : styles.border,
      `hover:${styles.border}`
    )}>
      {/* Glow on Hover */}
      <div className={cn("absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100", styles.glow)} />

      {/* Rarity Tag */}
      <div className={cn("absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold z-10 border", styles.bg, styles.text, styles.border)}>
        {cosmetic.rarity}
      </div>

      {/* Preview Area */}
      <div className="relative aspect-square flex items-center justify-center p-6 overflow-hidden">
        {/* Placeholder do Avatar do Usuário */}
        <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden ring-2 ring-zinc-700">
            <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover"/>
        </div>
        {/* Imagem da Moldura sobreposta */}
        <img 
          src={cosmetic.imageUrl} 
          alt={cosmetic.name}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none group-hover:animate-pulse-slow"
        />
      </div>

      {/* Info Area */}
      <div className="flex flex-col p-4 border-t border-zinc-800 bg-[#111111] rounded-b-xl flex-1">
        <h3 className="font-bold text-white text-base truncate">{cosmetic.name}</h3>
        <p className="text-xs text-zinc-500 mb-4">{cosmetic.rarity} Avatar Frame</p>

        <div className="mt-auto">
          <form action={formAction}>
            <input type="hidden" name="cosmeticId" value={cosmetic.id} />
            
            {isOwned ? (
              <Button disabled className="w-full bg-green-900/50 text-green-400 border border-green-800">
                <Check className="w-4 h-4 mr-2"/> Adquirido
              </Button>
            ) : !hasSufficientBalance ? (
              <Button disabled className="w-full bg-red-900/20 text-red-500 border border-red-900/50">
                <Lock className="w-4 h-4 mr-2"/> Saldo Insuficiente
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isPending} 
                className="w-full bg-[#1A1A1A] hover:bg-[#252525] border border-zinc-700 hover:border-[#FFD700] text-white"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : (
                  <>
                    <Coins className="w-4 h-4 mr-2 text-[#FFD700]"/>
                    Comprar por {cosmetic.price}
                  </>
                )}
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
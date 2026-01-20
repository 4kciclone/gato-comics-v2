"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { equipCosmetic } from "@/actions/cosmetics";
import { CosmeticCard } from "@/components/shop/cosmetic-card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Shirt } from "lucide-react";
import { Cosmetic } from "@prisma/client"; // Importa o tipo direto do Prisma
import { cn } from "@/lib/utils";

interface InventoryProps {
  cosmetics: Cosmetic[];
  equippedFrameId: string | null;
  equippedBgId: string | null;
  userAvatar: string;
}

export function Inventory({ cosmetics, equippedFrameId, equippedBgId, userAvatar }: InventoryProps) {

  // Separa os itens por tipo para renderizar em seções
  const frames = cosmetics.filter(c => c.type === 'AVATAR_FRAME');
  const backgrounds = cosmetics.filter(c => c.type === 'COMMENT_BACKGROUND');

  return (
    <div className="space-y-12">
      {/* SEÇÃO DE MOLDURAS */}
      <section>
        <h3 className="text-xl font-bold text-white mb-6">Molduras de Avatar</h3>
        {frames.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {frames.map((cosmetic) => (
              <InventoryItem 
                key={cosmetic.id}
                cosmetic={cosmetic}
                isEquipped={equippedFrameId === cosmetic.id}
                userAvatar={userAvatar}
              />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">Nenhuma moldura no inventário.</p>
        )}
      </section>

      {/* SEÇÃO DE FUNDOS */}
      <section>
        <h3 className="text-xl font-bold text-white mb-6">Banner de Comentário</h3>
        {backgrounds.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {backgrounds.map((cosmetic) => (
              <InventoryItem 
                key={cosmetic.id}
                cosmetic={cosmetic}
                isEquipped={equippedBgId === cosmetic.id}
                userAvatar={userAvatar}
              />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">Nenhum Banner no inventário.</p>
        )}
      </section>
    </div>
  );
}


// Componente para um único item no inventário
function InventoryItem({ cosmetic, isEquipped, userAvatar }: { cosmetic: Cosmetic, isEquipped: boolean, userAvatar: string }) {
    const [state, formAction, isPending] = useActionState(equipCosmetic, null);

    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);

    return (
        <div className={cn(
            "group relative flex flex-col rounded-2xl border bg-[#0a0a0a] transition-all duration-300",
            isEquipped ? "border-[#FFD700] ring-2 ring-[#FFD700]/50" : "border-zinc-800"
        )}>
            {/* Rarity Tag */}
            <div className={cn("absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold z-10 border", cosmetic.rarity === "RARE" ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-700 border-zinc-600 text-zinc-200" )}>
                {cosmetic.rarity}
            </div>

            {/* Preview Area */}
            <div className="relative aspect-square flex items-center justify-center p-6 overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden ring-2 ring-zinc-700">
                    <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover"/>
                </div>
                <img src={cosmetic.imageUrl} alt={cosmetic.name} className="absolute inset-0 w-full h-full object-contain pointer-events-none"/>
            </div>

            {/* Info e Botão */}
            <div className="flex flex-col p-4 border-t border-zinc-800 bg-[#111111] rounded-b-xl">
                <h3 className="font-bold text-white text-base truncate">{cosmetic.name}</h3>
                <form action={formAction} className="mt-4">
                    <input type="hidden" name="cosmeticId" value={cosmetic.id} />
                    <input type="hidden" name="cosmeticType" value={cosmetic.type} />
                    
                    {isEquipped ? (
                        <Button disabled className="w-full bg-zinc-800 text-zinc-400">
                            <Check className="w-4 h-4 mr-2"/> Equipado
                        </Button>
                    ) : (
                        <Button type="submit" disabled={isPending} className="w-full bg-[#1A1A1A] hover:bg-[#252525] border border-zinc-700 hover:border-white text-white">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Shirt className="w-4 h-4 mr-2"/> Equipar</>}
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}
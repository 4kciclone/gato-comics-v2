"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { toggleFeaturedWork } from "@/actions/favorites"; 

interface Work {
  id: string;
  title: string;
  coverUrl: string;
}

interface FavoritesManagerProps {
  allLikedWorks: Work[];
  userId: string;
}

export function FavoritesManager({ allLikedWorks }: FavoritesManagerProps) {
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  const toggleFavorite = async (workId: string) => {
    // Optimistic UI (Atualiza a interface antes do servidor responder)
    const isFeatured = featuredIds.includes(workId);
    let newFeatured;
    
    if (isFeatured) {
        newFeatured = featuredIds.filter(id => id !== workId);
    } else {
        if (featuredIds.length >= 5) {
            toast.error("Você só pode destacar 5 obras.");
            return;
        }
        newFeatured = [...featuredIds, workId];
    }
    
    setFeaturedIds(newFeatured);

    // Chama a server action
    const result = await toggleFeaturedWork(workId);
    
    // Agora o TypeScript sabe que 'error' pode existir (opcionalmente)
    if (result.error) {
        toast.error(result.error);
        // Reverte a mudança visual se der erro
        setFeaturedIds(featuredIds); 
    }
  };

  if (allLikedWorks.length === 0) {
    return (
        <div className="text-zinc-500 text-sm italic">
            Você ainda não favoritou nenhuma obra. Curta obras para destacá-las aqui.
        </div>
    );
  }

  return (
    <div className="space-y-4">
        <p className="text-xs text-zinc-400">Selecione até 5 obras para exibir no seu perfil ({featuredIds.length}/5)</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {allLikedWorks.map(work => {
                const isFeatured = featuredIds.includes(work.id);
                return (
                    <div key={work.id} className="relative group cursor-pointer" onClick={() => toggleFavorite(work.id)}>
                        {/* CORREÇÃO TAILWIND: aspect-2/3 em vez de aspect-[2/3] */}
                        <div className={`aspect-2/3 rounded-md overflow-hidden border-2 transition-all ${isFeatured ? "border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.3)]" : "border-transparent opacity-70 hover:opacity-100"}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover" />
                        </div>
                        {isFeatured && (
                            <div className="absolute top-1 right-1 bg-[#FFD700] text-black rounded-full p-1">
                                <Star className="w-3 h-3 fill-black" />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, Lock, Clock, CheckCircle, PlayCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // <-- Importe o Tooltip
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  title: string;
  slug: string;
  order: number;
  priceLite: number;
  pricePremium: number;
  isFree: boolean;
  createdAt: Date;
  isRead: boolean;
  isUnlocked: boolean;
  isRented: boolean;
}

interface ChapterListProps {
  chapters: Chapter[];
  workSlug: string;
  lastReadChapterId?: string | null;
}

export function ChapterList({ chapters, workSlug, lastReadChapterId }: ChapterListProps) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredChapters = chapters
    .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.order.toString().includes(search))
    .sort((a, b) => sortAsc ? a.order - b.order : b.order - a.order);

  return (
    <TooltipProvider> {/* <-- O Provider é necessário para o Tooltip funcionar */}
      <div className="space-y-6">
        {/* BARRA DE FERRAMENTAS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111111] p-4 rounded-xl border border-[#27272a]">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Buscar por número ou título..." 
              className="pl-10 bg-black border-[#27272a] focus-visible:ring-[#FFD700]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <Button 
                 onClick={() => setSortAsc(!sortAsc)}
                  // CORREÇÃO: Removemos variant="outline" e aplicamos classes de estilo customizadas
                 className="w-full md:w-auto bg-[#1A1A1A] border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-colors"
>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {sortAsc ? "Mais Antigos" : "Mais Recentes"}
             </Button>
          </div>
        </div>

        {/* LISTA DE CARDS DE CAPÍTULO */}
        <div className="space-y-2">
          {filteredChapters.map((chapter) => {
            const isLastRead = lastReadChapterId === chapter.id;
            
            return (
              <Link 
                key={chapter.id} 
                href={`/ler/${workSlug}/${chapter.slug}`}
                className="group block"
              >
                <div className={cn(
                  "relative flex items-center justify-between p-4 rounded-lg border transition-all duration-300 overflow-hidden",
                  "bg-[#0a0a0a] hover:bg-[#151515]",
                  isLastRead ? "border-[#FFD700] ring-2 ring-[#FFD700]/20 bg-[#FFD700]/5" : "border-[#27272a] hover:border-[#FFD700]/50"
                )}>
                  
                  <div className="flex items-center gap-4">
                     <div className={cn("w-12 h-12 rounded-md flex items-center justify-center font-bold text-lg shrink-0", isLastRead ? "bg-[#FFD700] text-black" : "bg-[#1A1A1A] text-zinc-400 group-hover:text-white")}>
                        {isLastRead ? <PlayCircle className="w-6 h-6" /> : chapter.order}
                     </div>
                     <div>
                        <h4 className={cn("font-semibold transition-colors line-clamp-1", isLastRead ? "text-[#FFD700]" : "text-zinc-200 group-hover:text-white")}>{chapter.title}</h4>
                        <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(chapter.createdAt).toLocaleDateString('pt-BR')}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     {isLastRead && <Badge className="hidden md:flex bg-[#FFD700] text-black hover:bg-[#FFD700] font-bold">Continuar</Badge>}

                     {/* CORREÇÃO: Ícones agora envolvidos com Tooltip */}
                     {chapter.isRead && !isLastRead && (
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <CheckCircle className="w-5 h-5 text-green-500 hidden md:block" />
                         </TooltipTrigger>
                         <TooltipContent className="bg-black border-zinc-700 text-white">
                           <p>Lido</p>
                         </TooltipContent>
                       </Tooltip>
                     )}
                     {chapter.isRented && (
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Clock className="w-5 h-5 text-blue-500 hidden md:block" />
                         </TooltipTrigger>
                         <TooltipContent className="bg-black border-zinc-700 text-white">
                           <p>Alugado</p>
                         </TooltipContent>
                       </Tooltip>
                     )}

                     {!chapter.isUnlocked && !chapter.isFree && (
                        <div className="text-right">
                           <div className="flex items-center justify-end gap-1 text-zinc-400 group-hover:text-[#FFD700] transition-colors">
                              <Lock className="w-3 h-3" />
                              <span className="text-sm font-bold">{chapter.pricePremium}</span>
                           </div>
                        </div>
                     )}
                     {chapter.isFree && <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Grátis</Badge>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
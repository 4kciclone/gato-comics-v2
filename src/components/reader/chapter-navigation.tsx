"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterNavProps {
  prevChapter: { slug: string; order: number } | null;
  nextChapter: { slug: string; order: number } | null;
  workSlug: string;
  workTitle: string;
  currentOrder: number;
}

export function ChapterNavigation({ 
  prevChapter, 
  nextChapter, 
  workSlug, 
  workTitle, 
  currentOrder 
}: ChapterNavProps) {
  
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-[#111] border-t border-[#27272a] sticky bottom-0 z-50 backdrop-blur-lg bg-opacity-90">
      
      {/* Botão Anterior */}
      <div className="flex-1">
        {prevChapter ? (
          <Link href={`/ler/${workSlug}/${prevChapter.slug}`} className="w-full sm:w-auto block">
            <Button variant="outline" className="w-full sm:w-auto border-zinc-700 text-white hover:bg-zinc-800">
              <ChevronLeft className="w-4 h-4 mr-2" /> 
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">Ant.</span>
            </Button>
          </Link>
        ) : (
          <Button disabled variant="ghost" className="w-full sm:w-auto text-zinc-600 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4 mr-2" /> Início
          </Button>
        )}
      </div>

      {/* Info Central */}
      <div className="flex-1 text-center hidden sm:block">
        <h2 className="text-sm font-bold text-white truncate px-2">{workTitle}</h2>
        <p className="text-xs text-[#FFD700]">Capítulo {currentOrder}</p>
      </div>

      {/* Botão Próximo */}
      <div className="flex-1 flex justify-end">
        {nextChapter ? (
          <Link href={`/ler/${workSlug}/${nextChapter.slug}`} className="w-full sm:w-auto block">
            <Button className="w-full sm:w-auto bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
              <span className="hidden sm:inline">Próximo</span>
              <span className="sm:hidden">Prox.</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        ) : (
          <Link href={`/obra/${workSlug}`} className="w-full sm:w-auto block">
             <Button className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-700 font-bold">
               Concluir <List className="w-4 h-4 ml-2" />
             </Button>
          </Link>
        )}
      </div>

    </div>
  );
}
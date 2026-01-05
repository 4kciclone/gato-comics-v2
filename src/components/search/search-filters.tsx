"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Flame, Clock, SortAsc } from "lucide-react";
import { useDebouncedCallback } from "use-debounce"; // Se nao tiver, faremos manual

export function SearchFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Função para atualizar a URL
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    params.set("page", "1"); // Reseta para pag 1 ao buscar
    replace(`/busca?${params.toString()}`);
  };

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", sort);
    params.set("page", "1");
    replace(`/busca?${params.toString()}`);
  };

  const currentSort = searchParams.get("sort") || "recent";

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
      {/* Barra de Busca */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input 
          placeholder="Pesquisar obra..." 
          className="pl-10 bg-[#111111] border-[#27272a] focus-visible:ring-[#FFD700]"
          defaultValue={searchParams.get("q")?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Botões de Filtro */}
      <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <Button 
          variant={currentSort === "recent" ? "default" : "outline"} 
          onClick={() => handleSort("recent")}
          className={currentSort === "recent" ? "bg-[#FFD700] text-black font-bold" : "border-zinc-800 text-zinc-400"}
        >
          <Clock className="w-4 h-4 mr-2" /> Recentes
        </Button>
        
        <Button 
          variant={currentSort === "popular" ? "default" : "outline"} 
          onClick={() => handleSort("popular")}
          className={currentSort === "popular" ? "bg-[#FFD700] text-black font-bold" : "border-zinc-800 text-zinc-400"}
        >
          <Flame className="w-4 h-4 mr-2" /> Populares
        </Button>

        <Button 
          variant={currentSort === "az" ? "default" : "outline"} 
          onClick={() => handleSort("az")}
          className={currentSort === "az" ? "bg-[#FFD700] text-black font-bold" : "border-zinc-800 text-zinc-400"}
        >
          <SortAsc className="w-4 h-4 mr-2" /> A-Z
        </Button>
      </div>
    </div>
  );
}
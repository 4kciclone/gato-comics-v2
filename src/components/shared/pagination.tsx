"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationControl({ totalPages }: { totalPages: number }) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `/busca?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-12">
      <Button 
        variant="outline" 
        disabled={currentPage <= 1}
        className="border-zinc-800 hover:text-white disabled:opacity-50"
        asChild={currentPage > 1}
      >
        {currentPage > 1 ? (
            <Link href={createPageURL(currentPage - 1)}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
            </Link>
        ) : (
            <span><ChevronLeft className="w-4 h-4 mr-2" /> Anterior</span>
        )}
      </Button>

      <span className="text-zinc-500 font-mono text-sm">
        Página <strong className="text-white">{currentPage}</strong> de {totalPages}
      </span>

      <Button 
        variant="outline" 
        disabled={currentPage >= totalPages}
        className="border-zinc-800 hover:text-white disabled:opacity-50"
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
            <Link href={createPageURL(currentPage + 1)}>
                Próximo <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
        ) : (
            <span>Próximo <ChevronRight className="w-4 h-4 ml-2" /></span>
        )}
      </Button>
    </div>
  );
}
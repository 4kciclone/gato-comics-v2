'use client';

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface WebtoonViewerProps {
  images: string[];
}

export function WebtoonViewer({ images }: WebtoonViewerProps) {
  // Otimização: Lazy loading nativo do navegador já ajuda muito
  
  if (images.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-zinc-500">
         <p>Nenhuma imagem disponível.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-black min-h-screen shadow-2xl">
      {images.map((url, index) => (
        <div key={index} className="relative w-full">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img
             src={url}
             alt={`Página ${index + 1}`}
             className="w-full h-auto block select-none"
             loading={index < 3 ? "eager" : "lazy"} // Carrega as 3 primeiras rápido, o resto sob demanda
             onContextMenu={(e) => e.preventDefault()} // Dificulta "Salvar Como"
           />
        </div>
      ))}
      
      <div className="h-32 flex items-center justify-center text-zinc-600 bg-[#050505]">
        <p>Fim do Capítulo</p>
      </div>
    </div>
  );
}
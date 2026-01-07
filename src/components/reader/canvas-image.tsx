"use client";

import { useRef, useEffect } from "react";

interface CanvasImageProps {
  src: string;
  alt: string;
  index: number;
}

export function CanvasImage({ src, alt, index }: CanvasImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Necessário se as imagens vêm de outro domínio
    img.src = src;

    img.onload = () => {
      // Ajusta as dimensões do canvas para corresponderem à imagem
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // "Desenha" a imagem dentro do canvas
      context.drawImage(img, 0, 0);
    };

    img.onerror = () => {
        console.error(`Falha ao carregar a imagem: ${src}`);
    };
  }, [src]);

  return (
    // Renderiza o canvas, mas ele começa vazio. O useEffect preencherá.
    // Usamos um aspect-ratio com min-height para evitar pulos de layout.
    <div className="relative w-full aspect-[2/3] min-h-64 bg-zinc-900">
       <canvas 
         ref={canvasRef} 
         aria-label={alt}
         className="absolute inset-0 w-full h-full"
         onContextMenu={(e) => e.preventDefault()} // Impede clique direito
       />
    </div>
  );
}
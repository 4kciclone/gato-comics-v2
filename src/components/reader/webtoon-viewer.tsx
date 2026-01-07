"use client";

import { CanvasImage } from "./canvas-image";
import { useInView } from "react-intersection-observer"; // Para lazy loading

export function WebtoonViewer({ images }: { images: string[] }) {
  return (
    <div className="max-w-3xl mx-auto bg-black shadow-2xl space-y-0">
      {images.map((url, index) => (
        // Lazy-loading: cada imagem só renderiza quando entra na tela
        <LazyCanvasImage key={index} src={url} alt={`Página ${index + 1}`} index={index} />
      ))}
      <div className="h-32 flex items-center justify-center text-zinc-600">Fim do Capítulo</div>
    </div>
  );
}

// Componente Wrapper para carregar as imagens sob demanda
function LazyCanvasImage(props: { src: string; alt: string; index: number; }) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Renderiza apenas uma vez
    rootMargin: '200px 0px', // Carrega a imagem 200px antes de ela entrar na tela
  });

  return (
    <div ref={ref}>
      {inView ? <CanvasImage {...props} /> : (
        // Placeholder para manter o espaço e evitar pulos de layout
        <div className="w-full aspect-[2/3] min-h-64 bg-zinc-900 animate-pulse" />
      )}
    </div>
  );
}
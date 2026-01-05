import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Clock, Star } from "lucide-react";

interface WorkCardProps {
  work: {
    title: string;
    slug: string;
    coverUrl: string;
    genres: string[];
    author: string;
    _count?: { chapters: number };
  };
  rank?: number; // Se passado, mostra o número do ranking
}

export function WorkCard({ work, rank }: WorkCardProps) {
  return (
    <Link href={`/obra/${work.slug}`} className="group relative block h-full">
      {/* Container da Imagem com Aspect Ratio de Mangá (2:3) */}
      {/* Tailwind v4 fix: aspect-2/3 */}
      <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] group-hover:border-[#FFD700]/50">
        
        {/* Imagem com Zoom no Hover */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={work.coverUrl}
          alt={work.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradiente de Proteção de Texto (Sempre visível no fundo) */}
        {/* Tailwind v4 fix: bg-linear-to-t */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Badge de Ranking (Se houver) */}
        {rank && (
          <div className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFD700] text-black font-black shadow-lg">
            {rank}
          </div>
        )}

        {/* Badges de Gênero (Aparecem no topo direito) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 transform translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          {work.genres.slice(0, 2).map((g) => (
            <Badge key={g} variant="secondary" className="bg-black/80 text-xs backdrop-blur-md border border-zinc-700 text-white">
              {g}
            </Badge>
          ))}
        </div>

        {/* Conteúdo (Desliza para cima no hover) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
          <h3 className="line-clamp-2 text-lg font-bold text-white leading-tight mb-1 group-hover:text-[#FFD700] transition-colors">
            {work.title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
             <span className="flex items-center gap-1">
               <Star className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />
               {work.author}
             </span>
             {work._count && (
               <span className="flex items-center gap-1">
                 <Clock className="w-3 h-3" />
                 {work._count.chapters} caps
               </span>
             )}
          </div>
        </div>
      </div>
    </Link>
  );
}
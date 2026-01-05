"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Info } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

interface HeroWork {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  synopsis: string;
  genres: string[];
}

export function HeroCarousel({ works }: { works: HeroWork[] }) {
  return (
    <section className="relative w-full overflow-hidden bg-[#050505] pt-6 pb-12 md:pt-10">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {works.map((work) => (
            <CarouselItem key={work.id} className="md:basis-full lg:basis-full">
              {/* Tailwind v4 fix: aspect-4/5 e aspect-21/9 */}
              <div className="relative w-full aspect-4/5 md:aspect-21/9 rounded-2xl overflow-hidden group mx-auto max-w-[95%] border border-[#27272a]">
                
                {/* BACKGROUND IMAGE (Blur & Darken) */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                  style={{ backgroundImage: `url(${work.coverUrl})` }}
                >
                   <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                   {/* Tailwind v4 fix: bg-linear-to-r */}
                   <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-transparent" />
                   {/* Tailwind v4 fix: bg-linear-to-t */}
                   <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                </div>

                {/* CONTENT OVERLAY */}
                <div className="relative h-full flex flex-col justify-end md:justify-center px-6 pb-8 md:px-16 md:w-2/3 lg:w-1/2 space-y-4 md:space-y-6 z-10">
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Badge className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]">Destaque</Badge>
                    {work.genres.slice(0, 3).map(g => (
                      <Badge key={g} variant="outline" className="text-zinc-300 border-zinc-600">{g}</Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter uppercase drop-shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
                    {work.title}
                  </h2>

                  {/* Synopsis (Desktop only) */}
                  <p className="hidden md:block text-zinc-300 text-sm md:text-base line-clamp-3 max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 fill-mode-both">
                    {work.synopsis}
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200 fill-mode-both">
                    <Link href={`/obra/${work.slug}`}>
                       <Button size="lg" className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90 rounded-full h-12 px-8 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all">
                         <Play className="w-5 h-5 mr-2 fill-black" /> Ler Agora
                       </Button>
                    </Link>
                    <Link href={`/obra/${work.slug}`}>
                       <Button size="lg" variant="outline" className="text-white border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 rounded-full h-12 px-6 backdrop-blur-md">
                         <Info className="w-5 h-5 mr-2" /> Detalhes
                       </Button>
                    </Link>
                  </div>

                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Navigation Buttons (Hidden on mobile) */}
        <div className="hidden md:block">
           <CarouselPrevious className="left-8 bg-black/50 border-white/10 text-white hover:bg-[#FFD700] hover:text-black hover:border-[#FFD700]" />
           <CarouselNext className="right-8 bg-black/50 border-white/10 text-white hover:bg-[#FFD700] hover:text-black hover:border-[#FFD700]" />
        </div>
      </Carousel>
    </section>
  );
}
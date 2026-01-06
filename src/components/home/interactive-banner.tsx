"use client";

import { useRef, MouseEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import styles from './interactive-banner.module.css'; // Importa o nosso CSS

// Reutilizando a variante de botão que criamos
const buttonVariants = {
  solid: "bg-[#FFD700] text-black font-bold rounded-full hover:bg-yellow-300 transition-colors",
};

export function InteractiveBanner() {
    const bannerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const banner = bannerRef.current;
        if (!banner) return;

        // Calcula a posição do mouse relativa ao banner
        const rect = banner.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Atualiza as variáveis CSS '--x' e '--y' em tempo real
        banner.style.setProperty("--x", `${x}px`);
        banner.style.setProperty("--y", `${y}px`);
    };

    return (
        <section 
            ref={bannerRef}
            onMouseMove={handleMouseMove}
            className={cn(
                "w-full rounded-2xl py-12 px-6 md:px-16 flex items-center justify-between",
                styles.banner // Aplica a classe principal do nosso CSS Module
            )}
        >
           {/* A grade de pontos que será revelada pelo mouse */}
           <div className={styles.dots} />

           <div className="relative z-10 max-w-2xl space-y-4">
              <Badge className="bg-black text-[#FFD700] border-none font-bold hover:bg-black">
                PREMIUM
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white italic">
                 DESBLOQUEIE O PODER TOTAL!
              </h2>
              <p className="text-zinc-200 text-lg">
                Assine um de nossos planos e desbloqueie uma ou mais de suas obras favoritas durante um mês.
              </p>
              <Link href="/shop">
                 <Button className={cn(buttonVariants.solid, "h-12 px-8 mt-4")}>
                    Ir para a Loja
                 </Button>
              </Link>
           </div>
        </section>
    );
}
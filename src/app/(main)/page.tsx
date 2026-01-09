import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { WorkCard } from "@/components/home/work-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Importação corrigida
import { RecommendationsRail } from "@/components/shared/recommendations-rail";
import { InteractiveBanner } from "@/components/home/interactive-banner";
import { BookOpen, Crown, ArrowRight, Play } from "lucide-react";

// Cache da página por 1 minuto (ISR)
export const revalidate = 60;

export default async function Home() {
  const session = await auth();

  const lastReadEntry = session?.user?.id ? await prisma.libraryEntry.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: { workId: true }
  }) : null;

  // 1. Buscas Paralelas no Banco (Alta Performance)
  const [featuredWorks, latestWorks, popularWorks, readingHistory] = await Promise.all([
    // Hero: 5 Obras
    prisma.work.findMany({
      where: { isHidden: false },
      take: 5,
      orderBy: { createdAt: 'desc' }
    }),

    // Latest: Últimas atualizadas
    prisma.work.findMany({
      where: { isHidden: false },
      take: 8,
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { chapters: true } } }
    }),

    // Popular: Ordenado por criação (simulado para MVP)
    prisma.work.findMany({
      where: { isHidden: false },
      take: 5,
      orderBy: { createdAt: 'asc' }, 
      include: { _count: { select: { chapters: true } } }
    }),

    // History: Apenas se logado
    session?.user?.id 
      ? prisma.libraryEntry.findMany({
          where: { userId: session.user.id, status: 'READING' },
          take: 6,
          orderBy: { updatedAt: 'desc' },
          include: { work: true }
        })
      : Promise.resolve([])
  ]);

  return (
    <div className="min-h-screen pb-20 bg-[#050505]">
      
      {/* 1. HERO CAROUSEL */}
      <HeroCarousel works={featuredWorks} />

      <div className="container mx-auto px-4 space-y-20 -mt-6 relative z-20">
        
        {/* 2. CONTINUE LENDO (Se houver histórico) */}
        {readingHistory.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-[#FFD700] rounded-full text-black">
                   <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-2xl font-bold text-white">Continuar Lendo</h2>
             </div>
             
             {/* Horizontal Scroll Rail */}
             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {readingHistory.map((entry) => (
                   <Link key={entry.id} href={`/obra/${entry.work.slug}`} className="snap-start shrink-0 w-64 group">
                      {/* Tailwind v4 fix: aspect-3/2 */}
                      <div className="relative aspect-3/2 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img src={entry.work.coverUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                         {/* Tailwind v4 fix: bg-linear-to-t */}
                         <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                         <div className="absolute bottom-3 left-3 right-3">
                            <p className="text-white font-bold truncate text-sm">{entry.work.title}</p>
                            <div className="w-full h-1 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                               <div className="h-full bg-[#FFD700] w-[60%]" /> {/* Barra simulada */}
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1">Capítulo Recente</p>
                         </div>
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center text-black shadow-lg shadow-[#FFD700]/50">
                               <Play className="w-4 h-4 fill-black ml-1" />
                            </div>
                         </div>
                      </div>
                   </Link>
                ))}
             </div>
          </section>
        )}

        {/* 3. RANKING / POPULARES */}
        <section>
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-[#FFD700]" />
                <h2 className="text-3xl font-black text-white tracking-tight">MAIS POPULARES</h2>
             </div>
             {/* Link funcional para a página de busca */}
             <Link href="/busca?sort=popular">
               <Button variant="ghost" className="text-zinc-400 hover:text-[#FFD700]">Ver Todos</Button>
             </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
             {popularWorks.map((work, idx) => (
                <WorkCard key={work.id} work={work} rank={idx + 1} />
             ))}
          </div>
        </section>

        {/* 4. BANNER LOJA (Internal Ad) */}
        <InteractiveBanner/>

        {/* 5. ÚLTIMAS ATUALIZAÇÕES */}
        <section>
          <div className="flex items-center gap-3 mb-6">
             <div className="h-8 w-1 bg-[#FFD700] rounded-full" />
             <h2 className="text-2xl font-bold text-white">Últimas Atualizações</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
             {latestWorks.map((work) => (
                <WorkCard key={work.id} work={work} />
             ))}
          </div>
          
          <div className="flex justify-center mt-12">
             {/* Link funcional para o catálogo completo */}
             <Link href="/busca?sort=recent">
                <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 h-12 px-8 rounded-full">
                    Ver Catálogo Completo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
             </Link>
          </div>
        </section>

      </div>
      {lastReadEntry?.workId && (
        <RecommendationsRail 
            workId={lastReadEntry.workId}
            userId={session?.user?.id}
        />
      )}
    </div>
  );
}
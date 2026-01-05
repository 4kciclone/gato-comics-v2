import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapterData } from "@/actions/reader";
import { WebtoonViewer } from "@/components/reader/webtoon-viewer";
import { Paywall } from "@/components/reader/paywall";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { RecommendationsRail } from "@/components/shared/recommendations-rail";

interface Props {
  params: Promise<{ workSlug: string; chapterSlug: string }>;
}

export default async function ReaderPage({ params }: Props) {
  const { workSlug, chapterSlug } = await params;
  
  const data = await getChapterData(workSlug, chapterSlug);

  if (!data.success) {
     const errorMessage = data.error;
     if (data.code === 404) return notFound();
     throw new Error(errorMessage);
  }

  // Desestruturamos a sessão junto com os outros dados
  const { work, chapter, navigation, session } = data;

  if (!chapter.isUnlocked) {
    return (
      <Paywall 
        chapterId={chapter.id}
        chapterTitle={chapter.title}
        workSlug={workSlug}
        chapterSlug={chapterSlug}
        priceLite={chapter.priceLite}
        pricePremium={chapter.pricePremium}
      />
    );
  }

  return (
    <div className="bg-[#111111] min-h-screen">
       {/* --- READER NAVBAR (Compacta) --- */}
       <header className="fixed top-0 inset-x-0 h-14 bg-[#050505]/90 backdrop-blur border-b border-[#27272a] z-50 flex items-center justify-between px-4">
          <Link href={`/obra/${workSlug}`} className="text-zinc-400 hover:text-white transition-colors">
             <div className="flex items-center gap-2">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-bold text-sm hidden md:inline">{work?.title}</span>
                <span className="text-zinc-600 hidden md:inline">/</span>
                <span className="text-[#FFD700] font-medium text-sm truncate max-w-37.5">{chapter.title}</span>
             </div>
          </Link>
          <div className="flex items-center gap-2">
             <Link href="/"><Button size="icon" variant="ghost" className="text-zinc-400"><Home className="w-5 h-5" /></Button></Link>
          </div>
       </header>

       {/* --- VIEWER --- */}
       <main className="pt-14 pb-24">
          <WebtoonViewer images={chapter.images} />
       </main>

       {/* --- RECOMENDAÇÕES (Fim do Capítulo) --- */}
       <RecommendationsRail
          workId={work.id}
          // CORREÇÃO: Passamos o userId diretamente da sessão retornada pela action
          userId={session?.user?.id}
          title="O que ler a seguir?"
       />
       
       {/* --- BOTTOM NAVIGATION --- */}
       <div className="fixed bottom-0 inset-x-0 h-20 bg-linear-to-t from-black to-transparent pointer-events-none flex items-end justify-center pb-6">
          <div className="pointer-events-auto flex items-center gap-4 bg-[#1A1A1A] border border-[#27272a] p-2 rounded-full shadow-xl">
             <Button variant="ghost" size="icon" disabled={!navigation.prev} asChild>
                {navigation.prev ? (
                  <Link href={`/ler/${workSlug}/${navigation.prev.slug}`}><ChevronLeft className="w-6 h-6" /></Link>
                ) : <span className="opacity-50"><ChevronLeft className="w-6 h-6"/></span>}
             </Button>
             <span className="text-sm font-bold text-zinc-400 min-w-25 text-center">Cap. {chapter.order}</span>
             <Button variant="ghost" size="icon" disabled={!navigation.next} asChild>
                {navigation.next ? (
                  <Link href={`/ler/${workSlug}/${navigation.next.slug}`}><ChevronRight className="w-6 h-6" /></Link>
                ) : <span className="opacity-50"><ChevronRight className="w-6 h-6"/></span>}
             </Button>
          </div>
       </div>
    </div>
  );
}
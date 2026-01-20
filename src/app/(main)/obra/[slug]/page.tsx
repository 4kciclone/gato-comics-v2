import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkImage } from "@/components/admin/work-image";
import { ChapterList } from "@/components/work/chapter-list";
import { CommentSection } from "@/components/comments/comment-section";
import { WorkActions } from "@/components/work/work-actions";
import { RecommendationsRail } from "@/components/shared/recommendations-rail";
import { 
  Play, Heart, Star, BookOpen, Calendar, User as UserIcon, Palette, AlertTriangle
} from "lucide-react";
import { LibraryEntry, Unlock } from "@prisma/client";

interface Props {
  params: Promise<{ slug: string }>;
}

// Configuração Visual das Classificações
const RATING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LIVRE: { label: "L", color: "text-green-500", bg: "bg-green-500" },
  DEZ_ANOS: { label: "10", color: "text-blue-400", bg: "bg-blue-500" },
  DOZE_ANOS: { label: "12", color: "text-yellow-400", bg: "bg-yellow-500" },
  QUATORZE_ANOS: { label: "14", color: "text-orange-500", bg: "bg-orange-500" },
  DEZESSEIS_ANOS: { label: "16", color: "text-red-500", bg: "bg-red-600" },
  DEZOITO_ANOS: { label: "18", color: "text-black bg-white", bg: "bg-black" }, // Estilo especial para +18
};

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const work = await prisma.work.findUnique({
    where: { slug, isHidden: false },
    include: {
      chapters: { 
        where: { workStatus: 'PUBLISHED' }, 
        orderBy: { order: "desc" } 
      },
      _count: { select: { chapters: true, likes: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  if (!work) {
    return notFound();
  }

  // Lógica de usuário (mantida igual)
  let userHistory: LibraryEntry | null = null;
  let userUnlocks: Map<string, Unlock> = new Map();
  let isLiked = false;
  let userRating = 0;

  if (session?.user?.id) {
    const [history, unlocks, like, review] = await Promise.all([
        prisma.libraryEntry.findUnique({ where: { userId_workId: { userId: session.user.id, workId: work.id } } }),
        prisma.unlock.findMany({ where: { userId: session.user.id, chapterId: { in: work.chapters.map(c => c.id) } } }),
        prisma.workLike.findUnique({ where: { userId_workId: { userId: session.user.id, workId: work.id } } }),
        prisma.review.findUnique({ where: { userId_workId: { userId: session.user.id, workId: work.id } }, select: { rating: true } }),
    ]);
    userHistory = history;
    userUnlocks = new Map(unlocks.map(u => [u.chapterId, u]));
    isLiked = !!like;
    userRating = review?.rating || 0;
  }
  
  const totalRating = work.reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = work.reviews.length > 0 ? (totalRating / work.reviews.length).toFixed(1) : "N/A";

  const firstChapter = work.chapters.length > 0 ? work.chapters[work.chapters.length - 1] : null;
  let nextChapterToRead = firstChapter;
  if (userHistory?.lastReadChapterId) {
    const lastReadIndex = work.chapters.findIndex(c => c.id === userHistory.lastReadChapterId);
    if (lastReadIndex !== -1 && lastReadIndex > 0) {
      nextChapterToRead = work.chapters[lastReadIndex - 1];
    } else {
      nextChapterToRead = work.chapters[0] ?? firstChapter;
    }
  }

  const chaptersWithUserStatus = work.chapters.map(chapter => {
    const unlockInfo = userUnlocks.get(chapter.id);
    const isUnlocked = chapter.isFree || (unlockInfo?.type === 'PERMANENT');
    const isRented = unlockInfo?.type === 'RENTAL' && unlockInfo.expiresAt ? unlockInfo.expiresAt > new Date() : false;
    return { ...chapter, isUnlocked: isUnlocked || isRented, isRented, isRead: userHistory?.lastReadChapterId === chapter.id };
  });

  // Configuração da Classificação
  const ratingInfo = RATING_CONFIG[work.ageRating] || RATING_CONFIG.LIVRE;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* --- HERO SECTION --- */}
      <div className="relative w-full min-h-[80vh] md:h-auto md:min-h-[600px] flex items-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110" style={{ backgroundImage: `url(${work.coverUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent" />

        <div className="container mx-auto px-4 h-full relative z-10 flex flex-col items-center text-center md:flex-row md:items-end md:text-left gap-8">
          
          <div className="w-48 md:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-800 shrink-0 md:transform md:translate-y-16 shadow-black/50 relative group">
            <WorkImage src={work.coverUrl} alt={work.title} className="w-full h-full" />
            
            {/* SELO DE CLASSIFICAÇÃO NA CAPA */}
            <div className={`absolute top-2 right-2 w-10 h-10 rounded flex items-center justify-center font-black text-lg shadow-lg ${ratingInfo.bg} text-white`}>
              {ratingInfo.label}
            </div>
          </div>

          <div className="flex-1 space-y-4">
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]">Webtoon</Badge>
                {work.genres.slice(0, 3).map(g => (<Badge key={g} variant="outline" className="border-zinc-700 backdrop-blur-sm bg-black/20 text-zinc-300">{g}</Badge>))}
             </div>
             
             <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase drop-shadow-lg leading-tight">{work.title}</h1>
             
             <div className="flex items-center justify-center md:justify-start flex-wrap gap-x-6 gap-y-2 text-zinc-300 font-medium text-sm md:text-base">
                <div className="flex items-center gap-2"><Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" /> <span className="text-white font-bold">{avgRating}</span> <span className="text-zinc-500">({work._count.reviews})</span></div>
                <div className="flex items-center gap-2"><Heart className="w-5 h-5 text-zinc-400" /> {work._count.likes} Favoritos</div>
                <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-zinc-400" /> {work._count.chapters} Capítulos</div>
             </div>

             <div className="pt-4 flex flex-col items-center md:items-start gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
               {nextChapterToRead ? (
                 <Link href={`/ler/${work.slug}/${nextChapterToRead.slug}`} className="w-full max-w-xs md:w-auto">
                    <Button size="lg" className="w-full bg-[#FFD700] text-black font-bold hover:bg-yellow-300 h-14 rounded-full px-8 text-lg shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all transform hover:-translate-y-1">
                      <Play className="w-6 h-6 mr-2 fill-black" /> 
                      {userHistory ? `Continuar: Cap. ${nextChapterToRead.order}` : "Começar a Ler"}
                    </Button>
                 </Link>
               ) : ( 
                <Button disabled size="lg" className="h-14 rounded-full px-8 text-lg bg-zinc-800 text-zinc-500">Em Breve</Button> 
               )}
               
               {session?.user && (
                <WorkActions workId={work.id} isLikedInitial={isLiked} userRatingInitial={userRating} />
               )}
             </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-16 md:mt-24 space-y-24">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <aside className="lg:col-span-4 space-y-8">
               
               {/* CARD SOBRE A OBRA */}
               <div className="bg-[#111111] border border-[#27272a] rounded-2xl p-6 lg:sticky lg:top-24 space-y-8">
                  
                  {/* SINOPSE */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sinopse</span>
                    <p className="text-zinc-300 leading-relaxed text-sm">{work.synopsis}</p>
                  </div>

                  <div className="w-full h-px bg-[#27272a]" />

                  {/* CLASSIFICAÇÃO E CONTEÚDO (NOVO) */}
                  <div className="space-y-3">
                     <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Classificação Indicativa</span>
                     <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                        <div className={`w-10 h-10 shrink-0 rounded flex items-center justify-center font-black text-lg ${ratingInfo.bg} text-white`}>
                           {ratingInfo.label}
                        </div>
                        <div>
                           <p className={`font-bold ${ratingInfo.color}`}>Não recomendado para menores de {ratingInfo.label === "L" ? "0" : ratingInfo.label} anos</p>
                           {work.contentTags.length > 0 ? (
                             <p className="text-xs text-zinc-500 mt-1">Contém: {work.contentTags.join(", ")}</p>
                           ) : (
                             <p className="text-xs text-zinc-500 mt-1">Nenhum conteúdo sensível listado.</p>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="w-full h-px bg-[#27272a]" />

                  {/* DETALHES TÉCNICOS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Autor</span><p className="text-white font-medium flex items-center gap-2"><UserIcon className="w-4 h-4 text-[#FFD700]" /> {work.author}</p></div>
                    <div><span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Estúdio</span><p className="text-white font-medium flex items-center gap-2"><Palette className="w-4 h-4 text-[#FFD700]" /> {work.studio || "N/A"}</p></div>
                    <div><span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Atualização</span><p className="text-white font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-zinc-500" /> Semanal</p></div>
                  </div>
               </div>

            </aside>
            <main className="lg:col-span-8">
               <ChapterList chapters={chaptersWithUserStatus} workSlug={work.slug} lastReadChapterId={userHistory?.lastReadChapterId}/>
            </main>
         </div>      
         <RecommendationsRail workId={work.id} userId={session?.user?.id} />
         <section id="comments">
           <CommentSection workId={work.id} />
         </section>
      </div>
      
    </div>
  );
}
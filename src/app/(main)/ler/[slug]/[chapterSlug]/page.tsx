import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ChapterNavigation } from "@/components/reader/chapter-navigation";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ReaderPageProps {
  params: Promise<{ slug: string; chapterSlug: string }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { slug, chapterSlug } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // 1. Buscar a Obra e o Capítulo Atual
  const work = await prisma.work.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true }
  });

  if (!work) return notFound();

  const chapter = await prisma.chapter.findUnique({
    where: { workId_slug: { workId: work.id, slug: chapterSlug } },
    include: {
        unlocks: userId ? { where: { userId } } : false
    }
  });

  if (!chapter) return notFound();

  // 2. Verificar Permissão de Acesso (Trava de Pagamento)
  const isUnlocked = chapter.isFree || (chapter.unlocks && chapter.unlocks.length > 0);
  
  if (!isUnlocked) {
    // Se não estiver desbloqueado, mostra tela de bloqueio
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-[#111] p-8 rounded-2xl border border-[#27272a] max-w-md w-full shadow-2xl">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6 text-[#FFD700]">
                    <Lock className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Capítulo Bloqueado</h1>
                <p className="text-zinc-400 mb-6">
                    Este é um capítulo premium de <strong className="text-white">{work.title}</strong>.
                </p>
                <div className="grid gap-3">
                    <Link href={`/obra/${work.slug}`}>
                        <Button className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90">
                            Ir para a página da obra
                        </Button>
                    </Link>
                    <Link href="/shop">
                        <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                            Comprar Patinhas
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
  }

  // 3. Registrar Leitura (Histórico)
  if (userId) {
    await prisma.libraryEntry.upsert({
        where: { userId_workId: { userId, workId: work.id } },
        create: { userId, workId: work.id, lastReadChapterId: chapter.id, status: 'READING' },
        update: { lastReadChapterId: chapter.id, updatedAt: new Date() }
    });
  }

  // 4. Buscar Próximo e Anterior (Para navegação)
  const [prevChapter, nextChapter] = await Promise.all([
    prisma.chapter.findFirst({
        where: { workId: work.id, order: { lt: chapter.order } },
        orderBy: { order: 'desc' },
        select: { slug: true, order: true }
    }),
    prisma.chapter.findFirst({
        where: { workId: work.id, order: { gt: chapter.order } },
        orderBy: { order: 'asc' },
        select: { slug: true, order: true }
    })
  ]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header Simples de Leitura */}
      <header className="h-14 bg-[#111] border-b border-[#27272a] flex items-center px-4 sticky top-0 z-50">
        <Link href={`/obra/${work.slug}`} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="ml-4 font-bold text-white truncate">
            {work.title} <span className="text-zinc-500 mx-2">/</span> Cap. {chapter.order}
        </span>
      </header>

      {/* ÁREA DE LEITURA (IMAGENS) */}
      <div className="flex-1 flex flex-col items-center bg-black min-h-screen">
         <div className="w-full max-w-3xl">
            {chapter.images.map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                    key={idx} 
                    src={img} 
                    alt={`Página ${idx + 1}`} 
                    className="w-full h-auto block"
                    loading={idx < 2 ? "eager" : "lazy"} // Carrega as 2 primeiras rápido
                />
            ))}
         </div>
      </div>

      {/* BARRA DE NAVEGAÇÃO (CLIENT COMPONENT) */}
      <ChapterNavigation 
         prevChapter={prevChapter}
         nextChapter={nextChapter}
         workSlug={work.slug}
         workTitle={work.title}
         currentOrder={chapter.order}
      />
    </div>
  );
}
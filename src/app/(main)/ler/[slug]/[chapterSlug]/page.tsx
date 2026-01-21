import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChapterNavigation } from "@/components/reader/chapter-navigation";
import { UnlockView } from "@/components/reader/unlock-view";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ReaderPageProps {
  params: Promise<{ slug: string; chapterSlug: string }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { slug, chapterSlug } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // 1. Buscar Obra, Capítulo e Saldo do Usuário
  const work = await prisma.work.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true }
  });

  if (!work) return notFound();

  const chapter = await prisma.chapter.findUnique({
    where: { workId_slug: { workId: work.id, slug: chapterSlug } },
    include: {
        // Busca se o usuário comprou este capítulo específico
        unlocks: userId ? { where: { userId } } : false
    }
  });

  if (!chapter) return notFound();

  // Bloqueio de segurança: Se não estiver publicado, ninguém vê
  if (chapter.workStatus !== 'PUBLISHED') {
      return notFound(); 
  }

  // 2. Verificar Permissão de Acesso
  
  // A) Verifica se tem assinatura ativa para esta obra
  let hasEntitlement = false;
  if (userId) {
      const entitlement = await prisma.workEntitlement.findUnique({
          where: { userId_workId: { userId, workId: work.id } }
      });
      hasEntitlement = !!entitlement;
  }

  // B) Calcula o acesso final
  // É desbloqueado se: É Grátis OU Tem Assinatura
  let isUnlocked = chapter.isFree || hasEntitlement; 
  
  // C) Se ainda não estiver desbloqueado, verifica compras avulsas (Rental/Permanent)
  if (!isUnlocked && chapter.unlocks && chapter.unlocks.length > 0) {
     const unlock = chapter.unlocks[0];
     if (unlock.type === 'PERMANENT') {
        isUnlocked = true;
     } else if (unlock.type === 'RENTAL' && unlock.expiresAt && unlock.expiresAt > new Date()) {
        isUnlocked = true;
     }
  }
  
  // --- SE CONTINUAR BLOQUEADO, MOSTRA TELA DE COMPRA ---
  if (!isUnlocked) {
    // Buscar saldo atualizado do usuário para passar pro componente de compra
    let userBalance = { lite: 0, premium: 0 };
    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                balancePremium: true,
                liteCoinBatches: { where: { expiresAt: { gt: new Date() } } }
            }
        });
        if (user) {
            const liteTotal = user.liteCoinBatches.reduce((acc, b) => acc + b.amount, 0);
            userBalance = { lite: liteTotal, premium: user.balancePremium };
        }
    }

    return (
        <UnlockView 
            chapterId={chapter.id}
            priceLite={chapter.priceLite}
            pricePremium={chapter.pricePremium}
            userBalance={userBalance}
            workSlug={work.slug}
        />
    );
  }
  // ----------------------------------------------------

  // 3. Registrar Leitura (Histórico) - Se chegou aqui, o usuário tem acesso
  if (userId) {
    await prisma.libraryEntry.upsert({
        where: { userId_workId: { userId, workId: work.id } },
        create: { userId, workId: work.id, lastReadChapterId: chapter.id, status: 'READING' },
        update: { lastReadChapterId: chapter.id, updatedAt: new Date() }
    });
  }

  // 4. Buscar Próximo e Anterior (Apenas capítulos PUBLICADOS)
  const [prevChapter, nextChapter] = await Promise.all([
    prisma.chapter.findFirst({
        where: { 
            workId: work.id, 
            workStatus: 'PUBLISHED',
            order: { lt: chapter.order } 
        },
        orderBy: { order: 'desc' },
        select: { slug: true, order: true },
    }),
    prisma.chapter.findFirst({
        where: { 
            workId: work.id, 
            workStatus: 'PUBLISHED',
            order: { gt: chapter.order } 
        },
        orderBy: { order: 'asc' },
        select: { slug: true, order: true }
    })
  ]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <header className="h-14 bg-[#111] border-b border-[#27272a] flex items-center px-4 sticky top-0 z-50">
        <Link href={`/obra/${work.slug}`} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="ml-4 font-bold text-white truncate">
            {work.title} <span className="text-zinc-500 mx-2">/</span> Cap. {chapter.order}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center bg-black min-h-screen">
         <div className="w-full max-w-3xl">
            {chapter.images.map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                    key={idx} 
                    src={img} 
                    alt={`Página ${idx + 1}`} 
                    className="w-full h-auto block"
                    loading={idx < 2 ? "eager" : "lazy"} 
                />
            ))}
         </div>
      </div>

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
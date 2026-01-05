import { prisma } from "@/lib/prisma";
import { WorkCard } from "@/components/home/work-card";
import { SearchFilters } from "@/components/search/search-filters";
import { PaginationControl } from "@/components/shared/pagination";
import { Ghost } from "lucide-react";

// Configurações
const ITEMS_PER_PAGE = 12;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  
  // 1. Extrair Parâmetros
  const query = searchParams.q || "";
  const currentPage = Number(searchParams.page) || 1;
  const sort = searchParams.sort || "recent";

  // 2. Definir Ordenação do Prisma
  let orderBy = {};
  switch (sort) {
    case "popular":
      // Como ainda não temos 'views', usamos quem tem mais capítulos como proxy de popularidade
      // ou createdAt asc (obras antigas tendem a ser conhecidas)
      orderBy = { createdAt: 'asc' }; 
      break;
    case "az":
      orderBy = { title: 'asc' };
      break;
    case "recent":
    default:
      orderBy = { updatedAt: 'desc' };
      break;
  }

  // 3. Buscar no Banco (Count + Data)
  const where = {
    isHidden: false,
    title: {
      contains: query,
      mode: "insensitive" as const, // Ignora maiúsculas/minúsculas
    },
  };

  const [totalItems, works] = await Promise.all([
    prisma.work.count({ where }),
    prisma.work.findMany({
      where,
      orderBy,
      take: ITEMS_PER_PAGE,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      include: {
        _count: { select: { chapters: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
          Catálogo Completo
        </h1>
        <p className="text-zinc-400">
          {totalItems} obras encontradas
        </p>
      </div>

      {/* Componente Cliente de Filtros */}
      <SearchFilters />

      {/* Grid de Resultados */}
      {works.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {works.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
             <PaginationControl totalPages={totalPages} />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
          <Ghost className="w-16 h-16 text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-zinc-400">Nenhum resultado</h3>
          <p className="text-zinc-500">Tente buscar por outro termo.</p>
        </div>
      )}
    </div>
  );
}
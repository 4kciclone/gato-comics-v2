import { getRecommendations } from "@/actions/recommendations";
import { WorkCard } from "@/components/home/work-card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Flame } from "lucide-react";

interface RecommendationsRailProps {
  workId: string;
  userId?: string;
  title?: string;
}

export async function RecommendationsRail({ workId, userId, title = "Recomendado para Você" }: RecommendationsRailProps) {
  // O componente chama a action diretamente para buscar os dados
  const recommendedWorks = await getRecommendations(workId, userId);

  // Se não houver recomendações, o componente não renderiza nada
  if (recommendedWorks.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t border-zinc-800 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
                <Flame className="w-6 h-6 text-[#FFD700]" />
                <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>

            <Carousel
                opts={{
                    align: "start",
                    dragFree: true,
                    skipSnaps: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    {recommendedWorks.map((work) => (
                        <CarouselItem key={work.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 pl-4">
                            <WorkCard work={work as any} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="hidden md:block">
                    <CarouselPrevious className="-left-4 bg-black/50 border-zinc-700 hover:bg-zinc-800" />
                    <CarouselNext className="-right-4 bg-black/50 border-zinc-700 hover:bg-zinc-800" />
                </div>
            </Carousel>
        </div>
    </section>
  );
}
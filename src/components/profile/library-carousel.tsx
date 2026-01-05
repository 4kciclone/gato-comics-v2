import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Play } from "lucide-react";
import { Work } from "@prisma/client";

interface LibraryCarouselProps {
    entries: {
        work: Work & { _count: { chapters: number } };
        lastReadChapterId: string | null;
    }[];
}

export function LibraryCarousel({ entries }: LibraryCarouselProps) {
    return (
        <Carousel
            opts={{ align: "start", dragFree: true }}
            className="w-full"
        >
            <CarouselContent className="-ml-4">
                {entries.map((entry) => (
                    <CarouselItem key={entry.work.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4">
                        <Link href={`/obra/${entry.work.slug}`} className="block group">
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg">
                                <img src={entry.work.coverUrl} alt={entry.work.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center text-black shadow-lg shadow-yellow-900/50">
                                        <Play className="w-5 h-5 fill-black ml-1" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                                    <h4 className="font-bold text-white text-sm truncate">{entry.work.title}</h4>
                                    {/* Lógica de progresso (simulada por enquanto) */}
                                    <Progress value={30} className="h-1 bg-zinc-700" />
                                    <p className="text-[10px] text-zinc-400">Cap. X de {entry.work._count.chapters}</p>
                                </div>
                            </div>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <div className="hidden md:block">
                <CarouselPrevious className="left-4 bg-black/50 border-zinc-700 hover:bg-zinc-800" />
                <CarouselNext className="right-4 bg-black/50 border-zinc-700 hover:bg-zinc-800" />
            </div>
        </Carousel>
    );
}
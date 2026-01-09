import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Work } from "@prisma/client";

// Estilo para o botão que será reutilizado
export const buttonVariants = {
  outline: "bg-transparent border-2 border-[#FFD700] text-[#FFD700] font-bold rounded-full hover:bg-[#FFD700] hover:text-black transition-all duration-300",
  solid: "bg-[#FFD700] text-black font-bold rounded-full hover:bg-yellow-300 transition-colors",
};

export async function PromoBanner() {
    const session = await auth();
    let lastReadWork: Work | null = null;

    // Se o usuário estiver logado, busca a última obra que ele leu
    if (session?.user?.id) {
        const lastEntry = await prisma.libraryEntry.findFirst({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
            include: { work: true }
        });
        if (lastEntry) {
            lastReadWork = lastEntry.work;
        }
    }

    return (
        <section className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] py-12 px-6 md:px-16 flex items-center justify-between shadow-[0_0_40px_rgba(138,43,226,0.2)]">
           <div className="relative z-10 max-w-2xl space-y-4">
              <Badge className="bg-black text-[#FFD700] border-none font-bold hover:bg-black">PREMIUM</Badge>
              <h2 className="text-3xl md:text-5xl font-black text-white italic">
                 DESBLOQUEIE O PODER TOTAL!
              </h2>
              {/* Texto Dinâmico */}
              <p className="text-zinc-200 text-lg">
                Assine um de nossos planos e desbloqueie uma ou mais de suas obras favoritas durante um mês.
              </p>
              <Link href="/shop">
                 <Button className={cn(buttonVariants.solid, "h-12 px-8 mt-4")}>
                    Ir para a Loja
                 </Button>
              </Link>
           </div>
           
           {/* Banner Dinâmico */}
           <div 
             className="absolute right-0 bottom-0 top-0 w-1/2 md:w-1/3 bg-no-repeat bg-contain bg-right-bottom opacity-10"
             style={{ backgroundImage: `url(${lastReadWork?.coverUrl || 'https://placehold.co/400x400/transparent/FFFFFF?text=Gato+Comics'})` }}
           />
        </section>
    );
}
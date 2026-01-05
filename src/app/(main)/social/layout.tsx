import Link from "next/link";
import { Home, Compass, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma"; // <-- IMPORTAÇÃO CORRIGIDA
import { TrendingTopics } from "@/components/social/trending-topics";

export default async function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // Usamos o prisma para buscar o username do usuário logado, que é seguro para URLs
  const user = session?.user?.id ? await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true }
  }) : null;
  const username = user?.username;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        <aside className="md:col-span-3 lg:col-span-2 hidden md:block">
          <div className="sticky top-24 space-y-2">
            <Link href="/social">
              <Button variant="ghost" className="w-full justify-start text-lg font-bold text-white hover:bg-zinc-800">
                <Home className="w-6 h-6 mr-3" /> Para Você
              </Button>
            </Link>
            <Link href="/social/explore">
              <Button variant="ghost" className="w-full justify-start text-lg font-bold text-zinc-300 hover:text-white hover:bg-zinc-800">
                <Compass className="w-6 h-6 mr-3" /> Explorar
              </Button>
            </Link>
            {username && (
              <Link href={`/u/${username}`}>
                <Button variant="ghost" className="w-full justify-start text-lg font-bold text-zinc-300 hover:text-white hover:bg-zinc-800">
                  <User className="w-6 h-6 mr-3" /> Perfil
                </Button>
              </Link>
            )}
          </div>
        </aside>

        <main className="md:col-span-9 lg:col-span-7 border-x border-[#27272a] min-h-screen">
          {children}
        </main>

        <aside className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <TrendingTopics />
          </div>
        </aside>

      </div>
    </div>
  );
}
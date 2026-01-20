import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/shared/user-nav";
import { RewardModal } from "@/components/rewards/reward-modal";
import { NotificationBell } from "@/components/shared/notification-bell";
import { Starfield } from "@/components/shared/starfield";
import { MobileDrawer } from "@/components/shared/mobile-drawer";
import { Search } from "lucide-react";
import { FaDiscord } from "react-icons/fa";

type NotificationWithUser = {
  id: string;
  type: string;
  link: string;
  originUser: {
    name: string | null;
  };
};

export default async function MainLayout({ children }: { children: React.ReactNode; }) {
  const session = await auth();
  let userBalance = { premium: 0, lite: 0 };
  let notifications: NotificationWithUser[] = [];
  let username: string | null = null;

  if (session?.user?.id) {
    const userId = session.user.id;
    const [dbUser, liteBatches, unreadNotifications] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, balancePremium: true }
      }),
      prisma.liteCoinBatch.findMany({ 
        where: { userId, expiresAt: { gt: new Date() } },
        select: { amount: true }
      }),
      prisma.notification.findMany({
          where: { userId: userId, isRead: false },
          orderBy: { createdAt: 'desc' }, take: 10,
          include: { originUser: { select: { name: true } } }
      })
    ]);
    
    if (dbUser) {
      username = dbUser.username;
      const totalLite = liteBatches.reduce((sum, batch) => sum + batch.amount, 0);
      userBalance = { premium: dbUser.balancePremium, lite: totalLite };
    }
    notifications = unreadNotifications;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full h-20 shadow-lg shadow-black/20">
        <div className="absolute inset-0 bg-linear-to-r from-[#FFD700] to-[#DAA520]" />
        <Starfield />
        
        <div className="container mx-auto px-4 h-full flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
            <div className="md:hidden">
              <MobileDrawer username={username} isLoggedIn={!!session?.user} />
            </div>
            <Link href="/" className="hidden md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="Gato Comics Logo" style={{ width: 180, height: 'auto' }} />
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              <Link href="/social"><Button variant="link" className="text-black font-semibold text-base hover:bg-black/10">Social</Button></Link>
              <Link href="/busca"><Button variant="link" className="text-black font-semibold text-base hover:bg-black/10">Catálogo</Button></Link>
            </nav>
          </div>

          <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <Link href="/">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src="/assets/logo.png" alt="Gato Comics Logo" style={{ width: 140, height: 'auto' }} />
             </Link>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {session?.user ? (
               <>
                  <div className="hidden md:flex items-center gap-1">
                    <RewardModal />
                    <NotificationBell initialNotifications={notifications} />
                  </div>
                  <UserNav user={session.user} balance={userBalance} />
               </>
            ) : ( 
               <Link href="/login">
                  <Button className="bg-black/20 hover:bg-black/40 text-white font-bold rounded-full">Entrar</Button>
               </Link>
            )}
            <div className="md:hidden">
              <Link href="/busca">
                <Button variant="ghost" size="icon" className="text-black hover:bg-black/10"><Search className="w-5 h-5"/></Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      
      {/* --- FOOTER (RODAPÉ) --- */}
      <footer className="border-t border-[#27272a] bg-[#0a0a0a] pt-16 pb-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Coluna 1: Marca */}
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <div className="bg-white rounded-2xl p-4 border-4 border-[#FFD700] shadow-[8px_8px_0px_0px_rgba(255,215,0,1)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/logo.png" alt="Gato Comics Logo" style={{ width: 150, height: 'auto' }} />
                </div>
              </Link>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Sua plataforma definitiva para leitura de webtoons e mangás. 
              </p>
            </div>

            {/* Coluna 2: Navegação */}
            <div>
              <h3 className="font-bold text-white mb-4">Explorar</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="/" className="hover:text-[#FFD700] transition-colors">Início</Link></li>
                <li><Link href="/busca" className="hover:text-[#FFD700] transition-colors">Catálogo</Link></li>
                <li><Link href="/shop" className="hover:text-[#FFD700] transition-colors">Loja de Patinhas</Link></li>
                <li><Link href="/social" className="hover:text-[#FFD700] transition-colors">Social</Link></li>
              </ul>
            </div>

            {/* Coluna 3: Legal */}
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="/terms" className="hover:text-[#FFD700] transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacy" className="hover:text-[#FFD700] transition-colors">Política de Privacidade</Link></li>
              </ul>
            </div>

            {/* Coluna 4: Social */}
            <div>
              <h3 className="font-bold text-white mb-4">Siga-nos</h3>
              <div className="flex gap-4">
                <a href="https://discord.gg/NNd2mdBYBB" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="hover:bg-[#5865F2] hover:text-white rounded-full">
                    <FaDiscord className="w-5 h-5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#27272a] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
            <p>&copy; {new Date().getFullYear()} Gato Comics LTDA. Todos os direitos reservados.</p>
            <p>Feito com 🐾 para leitores.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
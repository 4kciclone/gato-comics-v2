import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inventory } from "@/components/profile/inventory";
import { ProfileHeader } from "@/components/profile/profile-header";
import { LibraryCarousel } from "@/components/profile/library-carousel";
import { StatsTab } from "@/components/profile/stats-tab";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { 
  History, 
  BookOpen, 
  Gem, 
  Settings, 
  BarChart2, 
  ArrowUpRight, 
  ArrowDownLeft,
  Coins
} from "lucide-react";

// Função para calcular o nível e a progressão de XP
const calculateLevelInfo = (xp: number) => {
    if (xp < 100) return { level: 1, currentXp: xp, nextLevelXp: 100, progress: (xp / 100) * 100, rank: "Leitor Novato" };
    const level = Math.floor(Math.pow(xp / 100, 0.6)) + 1;
    const xpForCurrentLevel = 100 * Math.pow(level - 1, 1 / 0.6);
    const xpForNextLevel = 100 * Math.pow(level, 1 / 0.6);
    const xpInThisLevel = xp - xpForCurrentLevel;
    const xpToNextLevel = xpForNextLevel - xpForCurrentLevel;
    const progress = (xpInThisLevel / xpToNextLevel) * 100;
    let rank = "Leitor Novato";
    if (level >= 10) rank = "Leitor Veterano";
    if (level >= 25) rank = "Mestre das Páginas";
    if (level >= 50) rank = "Lorde dos Mangás";
    return { level, currentXp: Math.floor(xpInThisLevel), nextLevelXp: Math.ceil(xpToNextLevel), progress, rank };
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, transactions, library, inventory, chaptersReadCount, liteBatches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        equippedAvatarFrame: { select: { imageUrl: true } },
        equippedProfileBanner: { select: { imageUrl: true } },
      }
    }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.libraryEntry.findMany({
      where: { userId, status: 'READING' },
      include: { work: { include: { _count: { select: { chapters: true } } } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.userCosmetic.findMany({
      where: { userId },
      include: { cosmetic: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.unlock.count({ where: { userId } }),
    // CORREÇÃO: Buscamos os lotes de patinhas lite válidos
    prisma.liteCoinBatch.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { amount: true }
    })
  ]);

  if (!user) redirect("/login");
  
  // CORREÇÃO: Calculamos o saldo lite a partir dos lotes
  const totalLiteBalance = liteBatches.reduce((sum, batch) => sum + batch.amount, 0);

  const levelInfo = calculateLevelInfo(user.xp);
  const userAvatarUrl = user.image || `https://ui-avatars.com/api/?name=${user.name || 'G'}`;
  const ownedCosmetics = inventory.map(item => item.cosmetic);
  const statsData = { /* dados mockados/reais para estatísticas */ };

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <ProfileHeader user={user as any} levelInfo={levelInfo} />
      
      {/* Cards de Saldo ATUALIZADOS */}
      <div className="my-8 flex justify-center md:justify-end gap-4">
           <Card className="bg-[#111111] border-[#27272a] w-32 md:w-40">
             <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-xs text-zinc-500 uppercase font-bold mb-1">Lite</span>
                <div className="flex items-center gap-1">
                   <Coins className="w-4 h-4 text-zinc-400" />
                   <span className="text-xl font-bold text-white">{totalLiteBalance}</span>
                </div>
             </CardContent>
           </Card>
           <Card className="bg-[#111111] border-[#FFD700]/30 w-32 md:w-40 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
             <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-xs text-[#FFD700] uppercase font-bold mb-1">Premium</span>
                <div className="flex items-center gap-1">
                   <Coins className="w-4 h-4 text-[#FFD700]" />
                   <span className="text-xl font-bold text-white">{user.balancePremium}</span>
                </div>
             </CardContent>
           </Card>
      </div>

      <Tabs defaultValue="library" className="w-full">
        {/* Usamos nosso novo componente de abas customizado */}
        <ProfileTabs defaultValue="library" />

        <TabsContent value="library" className="space-y-12 animate-in fade-in-50">
           <section>
             <h2 className="text-2xl font-bold text-white mb-6">Continuar Lendo</h2>
             {library.length > 0 ? (
                <LibraryCarousel entries={library as any} />
             ) : (
                <div className="text-center py-20 border border-dashed border-[#27272a] rounded-xl bg-zinc-900/20">
                    <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500">Sua biblioteca está vazia. Comece a ler uma obra!</p>
                    <Link href="/busca"><Button variant="link" className="text-[#FFD700]">Explorar catálogo</Button></Link>
                </div>
             )}
           </section>
        </TabsContent>

        <TabsContent value="inventory" className="animate-in fade-in-50">
          <Inventory 
            cosmetics={ownedCosmetics}
            equippedFrameId={user.equippedAvatarFrameId}
            equippedBgId={user.equippedCommentBackgroundId}
            userAvatar={userAvatarUrl}
          />
        </TabsContent>
        
        <TabsContent value="stats" className="animate-in fade-in-50">
            <StatsTab data={statsData as any} />
        </TabsContent>

        <TabsContent value="wallet" className="animate-in fade-in-50">
           <Card className="bg-[#111111] border-[#27272a] text-white max-w-4xl mx-auto">
             <CardHeader>
               <CardTitle>Histórico de Transações</CardTitle>
               <CardDescription>Acompanhe suas compras e gastos de patinhas.</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {transactions.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-8">Nenhuma transação encontrada.</p>
                 ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-3 border-b border-[#27272a] last:border-0">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>
                              {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4"/>}
                           </div>
                           <div>
                              <p className="font-medium text-sm text-white">{tx.description}</p>
                              <p className="text-xs text-zinc-500">{new Date(tx.createdAt).toLocaleString('pt-BR')}</p>
                           </div>
                        </div>
                        <div className={`font-bold font-mono ${tx.amount > 0 ? 'text-green-400' : 'text-zinc-300'}`}>
                           {tx.amount > 0 ? '+' : ''}{tx.amount} <span className="text-xs text-zinc-600">{tx.currency}</span>
                        </div>
                      </div>
                    ))
                 )}
               </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
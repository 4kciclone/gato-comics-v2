import { auth } from "@/auth";
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
  ArrowDownLeft 
} from "lucide-react";

// Função para calcular o nível e a progressão de XP, pode ser movida para /lib/utils se usada em outros lugares
const calculateLevelInfo = (xp: number) => {
    if (xp < 100) return { level: 1, currentXp: xp, nextLevelXp: 100, progress: (xp / 100) * 100, rank: "Leitor Novato" };
    
    // Fórmula de progressão com curva de dificuldade crescente
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

    return { 
        level, 
        currentXp: Math.floor(xpInThisLevel), 
        nextLevelXp: Math.ceil(xpToNextLevel), 
        progress,
        rank
    };
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Busca de todos os dados necessários para o perfil em uma única leva de queries paralelas
  const [user, transactions, library, inventory, chaptersReadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { 
        equippedAvatarFrame: { select: { imageUrl: true } }, 
        equippedProfileBanner: { select: { imageUrl: true } } 
      }
    }),
    prisma.transaction.findMany({ 
      where: { userId }, 
      orderBy: { createdAt: "desc" }, 
      take: 20 
    }),
    prisma.libraryEntry.findMany({
      where: { userId, status: 'READING' },
      include: {
        work: { include: { _count: { select: { chapters: true } } } },
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.userCosmetic.findMany({
      where: { userId },
      include: { cosmetic: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.unlock.count({ where: { userId } })
  ]);

  if (!user) redirect("/login");

  const levelInfo = calculateLevelInfo(user.xp);
  const userAvatarUrl = user.image || `https://ui-avatars.com/api/?name=${user.name || 'G'}`;
  const ownedCosmetics = inventory.map(item => item.cosmetic);

  // Dados para a aba de estatísticas (parcialmente simulados para este exemplo)
  const statsData = {
      totalChaptersRead: chaptersReadCount,
      genreDistribution: [
          { name: 'Ação', value: 400 }, { name: 'Fantasia', value: 300 }, { name: 'Aventura', value: 300 },
          { name: 'Sci-Fi', value: 200 }, { name: 'Comédia', value: 150 },
      ],
      activityLast7Days: [
          { date: 'Seg', chapters: 4 }, { date: 'Ter', chapters: 2 }, { date: 'Qua', chapters: 8 }, 
          { date: 'Qui', chapters: 5 }, { date: 'Sex', chapters: 1 }, { date: 'Sáb', chapters: 10 }, { date: 'Dom', chapters: 3 }
      ],
      rarestCosmetic: inventory.sort((a, b) => b.cosmetic.rarity.localeCompare(a.cosmetic.rarity))[0]?.cosmetic
  };

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      
      <ProfileHeader user={user as any} levelInfo={levelInfo} />
      
      <Tabs defaultValue="library" className="w-full">
        {/* Barra de Abas Responsiva com scroll horizontal em telas pequenas */}
        <ProfileTabs />

        {/* Aba: MINHA BIBLIOTECA */}
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

        {/* Aba: INVENTÁRIO */}
        <TabsContent value="inventory" className="animate-in fade-in-50">
          <Inventory 
            cosmetics={ownedCosmetics}
            equippedFrameId={user.equippedAvatarFrameId}
            equippedBgId={user.equippedCommentBackgroundId}
            userAvatar={userAvatarUrl}
          />
        </TabsContent>
        
        {/* Aba: ESTATÍSTICAS */}
        <TabsContent value="stats" className="animate-in fade-in-50">
            <StatsTab data={statsData as any} />
        </TabsContent>

        {/* Aba: CARTEIRA (EXTRATO) */}
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
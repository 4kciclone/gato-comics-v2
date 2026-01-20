import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription // <--- ADICIONADO
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inventory } from "@/components/profile/inventory";
import { ProfileHeader } from "@/components/profile/profile-header";
import { LibraryCarousel } from "@/components/profile/library-carousel";
import { StatsTab } from "@/components/profile/stats-tab";
import { SettingsTab } from "@/components/profile/settings-tab";
import { FavoritesManager } from "@/components/profile/favorites-manager";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { PostCard } from "@/components/social/post-card";
import { 
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Settings, 
  Heart, 
  Crown, 
  MessageSquare,
  ArrowUpRight,   // <--- ADICIONADO
  ArrowDownLeft   // <--- ADICIONADO
} from "lucide-react";
import { calculateLevelInfo } from "@/lib/level-system";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, transactions, library, inventory, userUnlocks, liteBatches, featuredWorks, posts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        equippedAvatarFrame: { select: { imageUrl: true } },
        equippedProfileBanner: { select: { imageUrl: true } },
        _count: { select: { followers: true, following: true } }
      }
    }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.libraryEntry.findMany({
      where: { userId, status: 'READING' },
      include: { 
        work: { 
            include: { 
                _count: { select: { chapters: true } } 
            } 
        } 
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.userCosmetic.findMany({
      where: { userId },
      include: { cosmetic: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.unlock.findMany({
        where: { userId },
        select: {
            chapter: {
                select: {
                    work: { select: { title: true } }
                }
            }
        }
    }),
    prisma.liteCoinBatch.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { amount: true }
    }),
    prisma.workLike.findMany({
      where: { userId },
      include: { work: true }
    }),
    prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { equippedAvatarFrame: true } },
        likes: { where: { userId } },
        _count: { select: { likes: true, comments: true } }
      }
    })
  ]);

  if (!user) redirect("/login");

  const totalLiteBalance = liteBatches.reduce((sum, batch) => sum + batch.amount, 0);
  const levelInfo = calculateLevelInfo(user.xp);
  const userAvatarUrl = user.image || `https://ui-avatars.com/api/?name=${user.name || 'G'}`;
  
  // Lógica de Estatísticas
  const genreMap = new Map<string, number>();
  library.forEach(entry => {
    entry.work.genres.forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });
  });
  
  const genreDistribution = Array.from(genreMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Lógica de Obra Favorita
  const workReadCounts: Record<string, number> = {};
  userUnlocks.forEach((unlock) => {
    const title = unlock.chapter.work.title;
    workReadCounts[title] = (workReadCounts[title] || 0) + 1;
  });

  let favoriteWorkName: string | null = null;
  let maxCount = 0;

  Object.entries(workReadCounts).forEach(([title, count]) => {
    if (count > maxCount) {
        maxCount = count;
        favoriteWorkName = title;
    }
  });

  const statsData = {
    totalChaptersRead: userUnlocks.length,
    favoriteWork: favoriteWorkName || undefined,
    genreDistribution: genreDistribution.length > 0 ? genreDistribution : [{ name: "Sem dados", value: 1 }],
    activityLast7Days: [
        { date: "Seg", chapters: 0 }, 
        { date: "Ter", chapters: 0 }, 
        { date: "Qua", chapters: 0 },
        { date: "Qui", chapters: 0 }, 
        { date: "Sex", chapters: 0 }, 
        { date: "Sab", chapters: 0 }, 
        { date: "Dom", chapters: 0 },
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:py-10 min-h-screen space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
        <div className="lg:col-span-2">
           <ProfileHeader user={user} levelInfo={levelInfo} />
        </div>
        
        <div className="flex flex-col gap-4 h-full justify-end">
           <div className="grid grid-cols-2 gap-4">
              <Card className="bg-[#111] border-[#27272a] hover:border-zinc-700 transition-colors flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 text-center relative z-10">
                   <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-2">Saldo Lite</span>
                   <div className="flex items-center justify-center gap-2">
                      <CurrencyIcon type="lite" size={14} /> 
                      <span className="text-2xl font-bold text-white">{totalLiteBalance}</span>
                   </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111] border-[#FFD700]/30 hover:border-[#FFD700] transition-colors shadow-[0_0_20px_rgba(255,215,0,0.05)] flex flex-col justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-500/5" />
                <CardContent className="p-4 text-center relative z-10">
                   <span className="text-[10px] text-[#FFD700] uppercase font-bold tracking-wider block mb-2">Premium</span>
                   <div className="flex items-center justify-center gap-2">
                      <CurrencyIcon type="premium" size={14} />
                      <span className="text-2xl font-bold text-white">{user.balancePremium}</span>
                   </div>
                </CardContent>
              </Card>
           </div>

           <Link href="/profile/subscription" className="w-full">
              <Button 
                variant="outline" 
                className="w-full bg-[#111] border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white h-12 font-medium transition-all hover:border-[#FFD700]/50"
              >
                <Crown className={`w-4 h-4 mr-2 ${user.subscriptionTier ? 'text-[#FFD700]' : 'text-zinc-500'}`} />
                {user.subscriptionTier ? "Gerenciar Assinatura" : "Virar Assinante"}
              </Button>
           </Link>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <div className="overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <TabsList className="bg-transparent border-b border-zinc-800 w-full justify-start rounded-none h-auto p-0 gap-8 min-w-max">
                <Trigger value="posts" icon={MessageSquare} label="Publicações" />
                <Trigger value="library" icon={BookOpen} label="Biblioteca" />
                <Trigger value="overview" icon={Heart} label="Favoritos" />
                <Trigger value="inventory" icon={Shield} label="Inventário" />
                <Trigger value="stats" icon={BarChart3} label="Estatísticas" />
                <Trigger value="wallet" icon={TrendingUp} label="Extrato" />
                <Trigger value="settings" icon={Settings} label="Configurações" />
            </TabsList>
        </div>

        <div className="mt-6 min-h-100">
            <TabsContent value="posts" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-2xl mx-auto space-y-6">
                    {posts.length > 0 ? (
                        posts.map(post => {
                            const formattedPost = {
                                ...post,
                                isLiked: post.likes.length > 0
                            };
                            return (
                                <PostCard 
                                    key={post.id} 
                                    post={formattedPost} 
                                />
                            )
                        })
                    ) : (
                        <div className="text-center py-20 border border-dashed border-[#27272a] rounded-xl bg-zinc-900/20">
                            <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-500 font-medium">Você ainda não publicou nada.</p>
                            <Link href="/social" className="mt-4 inline-block"><Button variant="outline">Ir para o Feed</Button></Link>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="library" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Lendo Atualmente</h2>
                        <Link href="/busca"><Button variant="ghost" className="text-zinc-400">Ver Catálogo</Button></Link>
                    </div>
                    {library.length > 0 ? (
                        <LibraryCarousel entries={library} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#27272a] rounded-xl bg-zinc-900/20">
                            <div className="bg-zinc-900 p-4 rounded-full mb-4">
                                <BookOpen className="w-8 h-8 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 font-medium">Sua biblioteca está vazia.</p>
                            <Link href="/busca" className="mt-4"><Button variant="outline">Explorar Obras</Button></Link>
                        </div>
                    )}
                </section>
            </TabsContent>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <section>
                  <div className="flex items-center gap-2 mb-6">
                     <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                     <h2 className="text-xl font-bold text-white">Top 5 Favoritos</h2>
                  </div>
                  <FavoritesManager allLikedWorks={featuredWorks.map(l => l.work)} userId={user.id} />
               </section>
            </TabsContent>

            <TabsContent value="inventory" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Inventory 
                    cosmetics={inventory.map(i => i.cosmetic)}
                    equippedFrameId={user.equippedAvatarFrameId}
                    equippedBgId={user.equippedCommentBackgroundId}
                    userAvatar={userAvatarUrl}
                />
            </TabsContent>
            
            <TabsContent value="stats" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StatsTab data={statsData} />
            </TabsContent>

            <TabsContent value="wallet" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-[#111] border-[#27272a] text-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Extrato Financeiro</CardTitle>
                                <CardDescription>Últimas 20 movimentações na sua conta.</CardDescription>
                            </div>
                            <TrendingUp className="w-5 h-5 text-zinc-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-0 divide-y divide-[#27272a]">
                        {transactions.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center py-12">Nenhuma transação encontrada.</p>
                        ) : (
                            transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-4 hover:bg-zinc-900/50 px-2 rounded transition-colors -mx-2">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-full ${tx.amount > 0 ? 'bg-green-950/30 text-green-500' : 'bg-red-950/30 text-red-500'}`}>
                                        {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4"/>}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-white">{tx.description}</p>
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-wide">
                                            {new Date(tx.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className={`font-mono font-bold text-sm ${tx.amount > 0 ? 'text-green-400' : 'text-zinc-300'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                    <span className="text-[10px] text-zinc-600 ml-1">{tx.currency.substring(0,3)}</span>
                                </div>
                            </div>
                            ))
                        )}
                    </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SettingsTab user={user} />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function Trigger({ value, icon: Icon, label }: any) {
  return (
    <TabsTrigger 
      value={value} 
      className="data-[state=active]:bg-transparent data-[state=active]:text-[#FFD700] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#FFD700] rounded-none px-0 py-4 text-zinc-400 hover:text-white transition-colors"
    >
      <Icon className="w-4 h-4 mr-2" /> {label}
    </TabsTrigger>
  )
}
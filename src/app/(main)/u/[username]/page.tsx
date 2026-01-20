import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BookOpen, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/social/post-card";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await auth();
  const sessionUserId = session?.user?.id;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
        equippedAvatarFrame: true,
        equippedProfileBanner: true,
        _count: {
            select: {
                followers: true,
                following: true,
                posts: true
            }
        },
        liteCoinBatches: {
            where: { expiresAt: { gt: new Date() } }
        },
        posts: {
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { equippedAvatarFrame: true } },
                likes: { where: { userId: sessionUserId || "0" } },
                _count: { select: { likes: true, comments: true } }
            }
        }
    }
  });

  if (!user) return notFound();

  const isOwnProfile = session?.user?.id === user.id;

  const liteBalance = user.liteCoinBatches.reduce((acc, batch) => acc + batch.amount, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20">
      
      {/* --- BANNER --- */}
      <div className="relative h-48 md:h-72 bg-zinc-900 w-full overflow-hidden">
        {user.equippedProfileBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
                src={user.equippedProfileBanner.imageUrl} 
                alt="Banner" 
                className="w-full h-full object-cover"
            />
        ) : (
            // CORREÇÃO TAILWIND: bg-linear-to-r
            <div className="absolute inset-0 bg-linear-to-r from-[#FFD700]/10 to-zinc-900" />
        )}
        {/* CORREÇÃO TAILWIND: bg-linear-to-t */}
        <div className="absolute inset-0 bg-linear-to-t from-[#050505] to-transparent opacity-80" />
      </div>

      <div className="container mx-auto px-4">
        <div className="relative -mt-20 md:-mt-24 mb-8 flex flex-col md:flex-row items-end gap-6">
            
            {/* --- AVATAR --- */}
            <div className="relative group">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#050505] bg-[#111] relative z-10">
                    <Avatar className="w-full h-full">
                        <AvatarImage src={user.image || ""} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-[#FFD700] text-black font-black">
                            {user.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
                {user.equippedAvatarFrame && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                        src={user.equippedAvatarFrame.imageUrl} 
                        alt="Frame" 
                        className="absolute -top-5 -left-5 w-[135%] h-[135%] pointer-events-none z-20"
                    />
                )}
            </div>

            {/* --- INFO DO USUÁRIO --- */}
            <div className="flex-1 mb-2 space-y-2 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        {user.name}
                    </h1>
                    {user.role === "ADMIN" && <Badge className="bg-red-600 hover:bg-red-600 border-0">ADMIN</Badge>}
                    {user.role === "OWNER" && <Badge className="bg-[#FFD700] text-black hover:bg-[#FFD700] border-0">DONO</Badge>}
                    {user.role === "MODERATOR" && <Badge className="bg-blue-600 hover:bg-blue-600 border-0">MOD</Badge>}
                </div>
                
                <p className="text-zinc-400 font-mono">@{user.username}</p>

                <div className="flex items-center justify-center md:justify-start gap-6 text-sm pt-1">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{user._count.posts}</span> 
                        <span className="text-zinc-500">Posts</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{user._count.followers}</span> 
                        <span className="text-zinc-500">Seguidores</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{user._count.following}</span> 
                        <span className="text-zinc-500">Seguindo</span>
                    </div>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-zinc-500 mt-2">
                    <CalendarDays className="w-3 h-3" />
                    <span>Membro desde {user.createdAt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                </div>
            </div>
        </div>

        {/* --- ÁREA PRIVADA (CARTEIRA - Só Dono) --- */}
        {isOwnProfile && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 mb-12">
                <Card className="bg-[#111] border-[#27272a] shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Sua Carteira</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-2 bg-zinc-900/50 rounded-lg">
                            <span className="flex items-center gap-2 text-zinc-300 text-sm">
                                <CurrencyIcon type="lite" size={12} /> Saldo Lite
                            </span>
                            <span className="font-bold text-white">{liteBalance}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-zinc-900/50 rounded-lg border border-[#FFD700]/20">
                            <span className="flex items-center gap-2 text-[#FFD700] text-sm">
                                <CurrencyIcon type="premium" size={12} /> Premium
                            </span>
                            <span className="font-bold text-[#FFD700]">{user.balancePremium}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* --- ÁREA PÚBLICA (POSTS) --- */}
        <div className="mt-10 border-t border-zinc-900 pt-10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#FFD700]" /> Publicações
            </h2>

            <div className="max-w-2xl space-y-6">
                {user.posts.length > 0 ? (
                    user.posts.map(post => {
                        const formattedPost = {
                            ...post,
                            isLiked: post.likes.length > 0
                        };
                        return (
                            <PostCard 
                                key={post.id} 
                                post={formattedPost}
                                // CORREÇÃO 2: Removida a prop currentUserId que causava erro
                            />
                        )
                    })
                ) : (
                    <div className="text-center text-zinc-500 py-10 border border-dashed border-zinc-900 rounded-xl bg-zinc-900/20">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>Este usuário ainda não publicou nada.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
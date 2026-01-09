import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PostCard, type PostWithMeta } from "@/components/social/post-card";
import { Compass, Star } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default async function ExplorePage() {
    const session = await auth();
    const userId = session?.user?.id;

    const [popularPostsData, influentialUsers] = await Promise.all([
        prisma.post.findMany({
            where: { parentId: null },
            orderBy: {
                likes: { _count: 'desc' }
            },
            take: 20,
            include: {
                // CORREÇÃO: Adicionado 'username: true'
                user: { select: { id: true, name: true, username: true, image: true, equippedAvatarFrame: { select: { imageUrl: true } } } },
                _count: { select: { likes: true, comments: true } },
                likes: { where: { userId: userId || "" } }
            }
        }),
        prisma.user.findMany({
            orderBy: {
                followers: { _count: 'desc' }
            },
            take: 5,
            select: {
                id: true,
                name: true,
                username: true, // Adicionado para consistência
                image: true,
                _count: { select: { followers: true } }
            }
        })
    ]);

    const popularPosts: PostWithMeta[] = popularPostsData.map(p => ({ ...p, isLiked: p.likes.length > 0 }));

    return (
        <div>
            <div className="sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10 border-b border-[#27272a] p-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <Compass className="w-5 h-5 text-[#FFD700]"/> Explorar
                </h2>
            </div>
            <div className="p-4 border-b border-[#27272a]">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" /> Usuários Populares
                </h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                    {influentialUsers.map(user => (
                        <Link key={user.id} href={`/u/${user.username}`} className="shrink-0">
                            <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-800 transition-colors w-28">
                                <Avatar className="w-16 h-16 border-2 border-zinc-700">
                                    <AvatarImage src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} />
                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="text-xs font-bold text-white truncate w-full text-center">{user.name}</p>
                                <p className="text-[10px] text-zinc-500">{user._count.followers} seguidores</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="font-bold text-white p-4">Posts em Alta</h3>
                {popularPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
}
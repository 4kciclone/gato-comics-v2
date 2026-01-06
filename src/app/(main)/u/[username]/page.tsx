import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard, type PostWithMeta } from "@/components/social/post-card";
import { FollowButton } from "@/components/profile/follow-button";
import { Calendar, MapPin } from "lucide-react";
import { Prisma } from "@prisma/client";

interface ProfilePageProps {
  params: { username: string };
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = params;
  const session = await auth();
  const sessionUserId = session?.user?.id;

  const user = await prisma.user.findFirst({
    where: { 
        username: {
            equals: username,
            mode: "insensitive"
        }
    },
    include: {
      equippedAvatarFrame: { select: { imageUrl: true } },
      _count: {
        select: { followers: true, following: true },
      },
    },
  });

  if (!user) {
    return notFound();
  }

  const isFollowing = sessionUserId ? !!(await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: sessionUserId,
        followingId: user.id,
      },
    },
  })) : false;

  const postInclude = Prisma.validator<Prisma.PostInclude>()({
      user: { select: { id: true, name: true, username: true, image: true, equippedAvatarFrame: { select: { imageUrl: true } } } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: sessionUserId || "" } }
  });

  const userPosts = await prisma.post.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: postInclude,
  });

  const postsWithMeta: PostWithMeta[] = userPosts.map((post: typeof userPosts[0]) => ({
    ...post,
    isLiked: post.likes.length > 0
  }));
  
  const userAvatarUrl = user.image || `https://ui-avatars.com/api/?name=${user.name || 'G'}`;
  const frameUrl = user.equippedAvatarFrame?.imageUrl;

  return (
    <div className="min-h-screen">
      <div className="relative h-48 bg-zinc-900 border-b border-[#27272a]"></div>

      <div className="container mx-auto px-4">
        <div className="relative -mt-16 flex flex-col gap-4 border-b border-[#27272a] pb-6">
          <div className="flex justify-between items-start">
            <div className="relative w-32 h-32 shrink-0">
              <Avatar className="w-full h-full border-4 border-[#050505] rounded-full">
                <AvatarImage src={userAvatarUrl} />
                <AvatarFallback className="text-3xl font-bold">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {frameUrl && <img src={frameUrl} alt="Moldura" className="absolute -inset-1 w-34 h-34 pointer-events-none" />}
            </div>
            
            {sessionUserId && sessionUserId !== user.id && (
              <div className="pt-16">
                 <FollowButton profileUserId={user.id} isFollowingInitial={isFollowing} />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-zinc-500">@{user.username}</p>
          </div>

          <p className="text-zinc-300 text-sm max-w-lg">
            Bio do usuário.
          </p>
          
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Brasil</div>
            <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> 
                {/* CORREÇÃO: Formatação da data para string */}
                Entrou em {new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <p><strong className="text-white">{user._count.following}</strong> <span className="text-zinc-500">Seguindo</span></p>
            <p><strong className="text-white">{user._count.followers}</strong> <span className="text-zinc-500">Seguidores</span></p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-4">Posts & Respostas</h2>
          <div className="border-t border-[#27272a]">
            {postsWithMeta.length > 0 ? (
              postsWithMeta.map(post => (<PostCard key={post.id} post={post} />))
            ) : (
              <div className="text-center text-zinc-500 py-20">
                <p>@{user.name} ainda não postou nada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
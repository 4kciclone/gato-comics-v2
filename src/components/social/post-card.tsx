"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle } from "lucide-react";
import { toggleLikePost } from "@/actions/social";
import { PostOptions } from "./post-options";
import { cn } from "@/lib/utils";

export type PostWithMeta = {
    id: string; content: string; imageUrl: string | null; createdAt: Date;
    user: { 
        id: string; name: string | null; username: string | null; image: string | null; 
        equippedAvatarFrame: { imageUrl: string; } | null; 
    };
    _count: { likes: number; comments: number; }; 
    isLiked: boolean;
};

export function PostCard({ post }: { post: PostWithMeta }) {
    const { data: session } = useSession();
    const isOwner = session?.user?.id === post.user.id;
    const userAvatarUrl = post.user.image || `https://ui-avatars.com/api/?name=${post.user.name || 'G'}`;
    const frameUrl = post.user.equippedAvatarFrame?.imageUrl;
    const [liked, setLiked] = useState(post.isLiked);
    const [likeCount, setLikeCount] = useState(post._count.likes);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
        await toggleLikePost(post.id);
    };

    if (!post.user.username) return null;

    return (
      <div className="flex gap-4 p-4 border-b border-[#27272a] transition-colors hover:bg-white/5 relative group">
        {/* Link principal do card, vai para a página do post */}
        <Link href={`/social/post/${post.id}`} className="absolute inset-0 z-0" aria-label={`Ver post de ${post.user.name}`} />
        
        <Link href={`/u/${post.user.username}`} className="relative w-10 h-10 shrink-0 z-10">
            <Avatar className="w-full h-full">
                <AvatarImage src={userAvatarUrl} />
                <AvatarFallback>{post.user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {frameUrl && (
                <img src={frameUrl} alt="Moldura de Avatar" className="absolute inset-0 w-full h-full pointer-events-none"/>
            )}
        </Link>

        <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    <Link href={`/u/${post.user.username}`} className="font-bold text-white hover:underline relative z-10">{post.user.name}</Link>
                    <span className="text-zinc-500">· @{post.user.username}</span>
                    <span className="text-zinc-500">· {new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="relative z-10">
                    <PostOptions postId={post.id} postContent={post.content} isOwner={isOwner} />
                </div>
            </div>

            <p className="text-zinc-300 whitespace-pre-wrap">{post.content}</p>

            {post.imageUrl && (
                <div className="mt-3 rounded-2xl border border-zinc-700 overflow-hidden relative z-10">
                    <img src={post.imageUrl} alt="Imagem do post" className="w-full h-auto"/>
                </div>
            )}

            <div className="flex items-center gap-6 pt-3 relative z-10">
                {/* --- CORREÇÃO APLICADA AQUI --- */}
                {/* O Botão de Comentário agora é um Link */}
                <Link 
                  href={`/social/post/${post.id}#comments`} // O '#comments' ancora para a seção de comentários
                  onClick={(e) => e.stopPropagation()} // Impede o link do card principal de ser ativado
                  className="flex items-center gap-2 text-zinc-500 hover:text-white rounded-md p-1 -ml-1 transition-colors"
                  aria-label={`Ver ${post._count.comments} comentários`}
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post._count.comments}</span>
                </Link>

                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLike}
                    className={cn("flex items-center gap-2 p-1 -ml-1", liked ? "text-red-500 hover:text-red-400" : "text-zinc-500 hover:text-red-500")}
                    aria-label={`Curtir post, atualmente com ${likeCount} curtidas`}
                >
                    <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                    <span className="text-sm font-medium">{likeCount}</span>
                </Button>
            </div>
        </div>
      </div>
    );
}
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
    id: string; 
    content: string; 
    imageUrl: string | null; 
    createdAt: Date;
    user: { 
        id: string; 
        name: string | null; 
        username: string | null; 
        image: string | null; 
        equippedAvatarFrame: { imageUrl: string; } | null; 
    };
    _count: { 
        likes: number; 
        comments: number; 
    }; 
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

    // Proteção: Não renderiza o card se, por algum motivo, não houver um username para linkar.
    if (!post.user.username) {
        return null;
    }

    return (
      <div className="flex gap-4 p-4 border-b border-[#27272a] transition-colors hover:bg-white/5 relative">
        <Link href={`/social/post/${post.id}`} className="absolute inset-0 z-0" aria-label={`Ver post de ${post.user.name}`} />
        
        {/* CORREÇÃO AQUI: Garante que o link usa o 'username' do post atual */}
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
                    {/* CORREÇÃO AQUI: Garante que o link usa o 'username' do post atual */}
                    <Link href={`/u/${post.user.username}`} className="font-bold text-white hover:underline relative z-10">
                        {post.user.name}
                    </Link>
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
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-zinc-500 hover:text-white">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post._count.comments}</span>
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLike}
                    className={cn("flex items-center gap-2 transition-colors", liked ? "text-red-500" : "text-zinc-500 hover:text-red-500")}
                >
                    <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                    <span>{likeCount}</span>
                </Button>
            </div>
        </div>
      </div>
    );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { CreatePostForm } from "./create-post-form";
import { Timeline } from "./timeline";
import { PostWithMeta } from "./post-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchMorePosts } from "@/actions/social";

interface SocialPageClientProps {
  initialGlobalPosts: PostWithMeta[];
  initialFollowingPosts: PostWithMeta[];
  userAvatar: string;
}

export function SocialPageClient({ initialGlobalPosts, initialFollowingPosts, userAvatar }: SocialPageClientProps) {
  const [feedType, setFeedType] = useState<'global' | 'following'>('global');
  
  const [posts, setPosts] = useState(initialGlobalPosts);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialGlobalPosts.length >= 20);
  
  const isLoading = useRef(false);

  useEffect(() => {
    if (feedType === 'global') {
      setPosts(initialGlobalPosts);
      setHasMore(initialGlobalPosts.length >= 20);
    } else {
      setPosts(initialFollowingPosts);
      setHasMore(initialFollowingPosts.length >= 20);
    }
    setPage(2);
  }, [feedType, initialGlobalPosts, initialFollowingPosts]);

  const loadMore = async () => {
    if (!hasMore || isLoading.current) return;
    isLoading.current = true;

    const newPosts = await fetchMorePosts(page, feedType);
    if (newPosts.length > 0) {
      // CORREÇÃO APLICADA AQUI
      setPosts((prev) => [...prev, ...newPosts]);
      setPage((prev) => prev + 1);
    } else {
      setHasMore(false);
    }
    isLoading.current = false;
  };

  return (
    <div>
      <div className="sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10 border-b border-[#27272a]">
        <div className="flex">
          <Button 
            onClick={() => setFeedType('global')} 
            variant="ghost" 
            className={cn(
                "flex-1 rounded-none h-14 font-bold transition-colors",
                feedType === 'global' 
                    ? 'border-b-2 border-[#FFD700] text-white' 
                    : 'text-zinc-500 hover:bg-zinc-900'
            )}
          >
            Para Você
          </Button>
          <Button 
            onClick={() => setFeedType('following')} 
            variant="ghost" 
            className={cn(
                "flex-1 rounded-none h-14 font-bold transition-colors",
                feedType === 'following' 
                    ? 'border-b-2 border-[#FFD700] text-white' 
                    : 'text-zinc-500 hover:bg-zinc-900'
            )}
          >
            Seguindo
          </Button>
        </div>
      </div>
      
      <CreatePostForm userAvatar={userAvatar} />

      <Timeline posts={posts} loadMore={loadMore} hasMore={hasMore} />

      {posts.length === 0 && (
        <div className="text-center text-zinc-500 py-20 border-t border-zinc-800">
          {feedType === 'global' ? (
            <p>Ainda não há posts. Seja o primeiro a compartilhar algo!</p>
          ) : (
            <p>Você ainda não segue ninguém ou as pessoas que você segue não postaram nada.</p>
          )}
        </div>
      )}
    </div>
  );
}
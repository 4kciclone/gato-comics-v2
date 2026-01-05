"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { PostCard, type PostWithMeta } from "./post-card";
import { Loader2 } from "lucide-react";

interface TimelineProps {
  posts: PostWithMeta[];    // Agora recebe a lista completa
  loadMore: () => void;     // Recebe a função para carregar mais
  hasMore: boolean;         // Recebe o estado de "tem mais"
}

export function Timeline({ posts, loadMore, hasMore }: TimelineProps) {
  const { ref, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  return (
    <div className="border-t border-zinc-800">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {hasMore && (
        <div ref={ref} className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
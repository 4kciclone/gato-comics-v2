"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitReview, toggleWorkLike } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Star, Heart, Share2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkActionsProps {
  workId: string;
  isLikedInitial: boolean;
  userRatingInitial: number; // 0 se não avaliou
}

export function WorkActions({ workId, isLikedInitial, userRatingInitial }: WorkActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isLiked, setIsLiked] = useState(isLikedInitial);
  const [rating, setRating] = useState(userRatingInitial);
  const [hoverRating, setHoverRating] = useState(0);

  const handleLike = () => {
    startTransition(async () => {
      setIsLiked(!isLiked); // UI Otimista
      const result = await toggleWorkLike(workId);
      if (result?.error) toast.error(result.error);
    });
  };

  const handleRating = (newRating: number) => {
    startTransition(async () => {
      setRating(newRating);
      const result = await submitReview(workId, newRating);
      if (result?.success) toast.success("Obrigado pela sua avaliação!");
      if (result?.error) toast.error(result.error);
    });
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
      {/* Sistema de Avaliação por Estrelas */}
      <div className="flex items-center gap-1 p-2 bg-black/20 border border-zinc-800 rounded-full backdrop-blur-sm">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star} 
            disabled={isPending}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-2 rounded-full transition-colors"
          >
            <Star className={cn(
              "w-6 h-6 transition-all",
              star <= (hoverRating || rating) 
                ? "text-[#FFD700] fill-[#FFD700] scale-110" 
                : "text-zinc-600"
            )} />
          </button>
        ))}
      </div>

      {/* Botão de Favoritar */}
      <Button 
        size="icon" 
        variant="outline"
        disabled={isPending}
        onClick={handleLike}
        className="h-14 w-14 rounded-full border-white/20 bg-white/10 text-white hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors"
      >
        <Heart className={cn("w-6 h-6 transition-all", isLiked && "fill-current")} />
      </Button>

      {/* Botão de Compartilhar */}
      <Button 
        size="icon" 
        variant="outline"
        onClick={handleShare}
        className="h-14 w-14 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <Share2 className="w-6 h-6" />
      </Button>
    </div>
  );
}
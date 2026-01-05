"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollowUser } from "@/actions/social";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  profileUserId: string;
  isFollowingInitial: boolean;
}

export function FollowButton({ profileUserId, isFollowingInitial }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    startTransition(async () => {
      // UI Otimista: atualiza o estado antes da resposta do servidor
      setIsFollowing(!isFollowing);
      await toggleFollowUser(profileUserId);
    });
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={isPending}
      variant={isFollowing ? "outline" : "default"}
      className={cn(
        "rounded-full font-bold transition-all",
        isFollowing 
          ? "border-zinc-700 bg-transparent text-white hover:bg-red-900/20 hover:text-red-400 hover:border-red-900" 
          : "bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
      )}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-2" /> Seguindo
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" /> Seguir
        </>
      )}
    </Button>
  );
}
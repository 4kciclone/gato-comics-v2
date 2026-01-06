"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";
import { ReportButton } from "./report-button";
import { MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentWithUser } from "./comment-section";

export function CommentItem({ comment, workId, postId }: { comment: CommentWithUser, workId?: string, postId?: string }) {
  const [isReplying, setIsReplying] = useState(false);
  const [isSpoilerVisible, setIsSpoilerVisible] = useState(false);

  const userAvatarUrl = comment.user.image || `https://ui-avatars.com/api/?name=${comment.user.name || 'G'}&background=111111&color=FFD700`;
  const frameUrl = comment.user.equippedAvatarFrame?.imageUrl;
  const backgroundUrl = comment.user.equippedCommentBackground?.imageUrl;

  const content = (
    <div
      className={cn("text-zinc-300 text-sm leading-relaxed", comment.isSpoiler && !isSpoilerVisible && "blur-sm cursor-pointer")}
      onClick={() => comment.isSpoiler && setIsSpoilerVisible(true)}
    >
      {comment.isSpoiler && !isSpoilerVisible
        ? "Este comentário contém spoilers. Clique para revelar."
        : comment.content}
    </div>
  );

  return (
    <div className="flex gap-4">
      <div className="relative w-12 h-12 shrink-0">
        <Avatar className="w-full h-full">
          <AvatarImage src={userAvatarUrl} />
          <AvatarFallback>{comment.user.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        {frameUrl && (
          <img src={frameUrl} alt="Moldura" className="absolute inset-0 w-full h-full pointer-events-none" />
        )}
      </div>

      <div className="flex-1">
        <div 
          className="relative rounded-xl border border-[#27272a] bg-[#111111] overflow-hidden p-4 bg-cover bg-center"
          style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {}}
        >
          {backgroundUrl && <div className="absolute inset-0 bg-black/60" />}
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">{comment.user.name}</span>
              {/* CORREÇÃO: Formatação da data para string */}
              <span className="text-xs text-zinc-500">{new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {content}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white" onClick={() => setIsReplying(!isReplying)}>
              <MessageSquare className="w-3 h-3 mr-2" /> Responder
            </Button>
          </div>
          <ReportButton commentId={comment.id} />
        </div>

        {isReplying && (
          <div className="mt-4">
            <CommentForm workId={workId} postId={postId} parentId={comment.id} onSuccess={() => setIsReplying(false)} />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-6 border-l-2 border-[#27272a] space-y-6">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} workId={workId} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
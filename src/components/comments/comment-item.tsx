"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";
import { ReportButton } from "./report-button";
import { MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
// Importe o tipo correto se estiver em outro arquivo, ou defina como 'any' se preferir flexibilidade
import type { CommentWithUser } from "./comment-section"; 

interface CommentItemProps {
  comment: CommentWithUser;
  workId?: string;
  postId?: string;
  currentUserId?: string; // <--- ADICIONADO AQUI
}

export function CommentItem({ comment, workId, postId, currentUserId }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isSpoilerVisible, setIsSpoilerVisible] = useState(false);

  const userAvatarUrl = comment.user.image || `https://ui-avatars.com/api/?name=${comment.user.name || 'G'}&background=111111&color=FFD700`;
  const frameUrl = comment.user.equippedAvatarFrame?.imageUrl;
  const backgroundUrl = comment.user.equippedCommentBackground?.imageUrl;

  // Formatação da data com horário
  const formattedDate = new Date(comment.createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const content = (
    <div
      className={cn("text-zinc-300 text-sm leading-relaxed", comment.isSpoiler && !isSpoilerVisible && "blur-sm cursor-pointer select-none")}
      onClick={() => comment.isSpoiler && setIsSpoilerVisible(true)}
      title={comment.isSpoiler && !isSpoilerVisible ? "Clique para revelar o spoiler" : ""}
    >
      {comment.isSpoiler && !isSpoilerVisible
        ? "Este comentário contém spoilers. Clique para revelar."
        : comment.content}
    </div>
  );

  return (
    <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Avatar e Moldura */}
      <div className="relative w-12 h-12 shrink-0">
        <Avatar className="w-full h-full border border-zinc-800">
          <AvatarImage src={userAvatarUrl} className="object-cover" />
          <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">
            {comment.user.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {frameUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={frameUrl} 
            alt="Moldura" 
            className="absolute -top-1.5 -left-1.5 w-[125%] h-[125%] pointer-events-none z-10" 
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div 
          className="relative rounded-xl border border-[#27272a] bg-[#111111] overflow-hidden p-4 bg-cover bg-center shadow-sm"
          style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {}}
        >
          {/* Overlay escuro se tiver imagem de fundo */}
          {backgroundUrl && <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />}
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm hover:text-[#FFD700] transition-colors cursor-pointer">
                {comment.user.name}
              </span>
              
              <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </span>
            </div>
            {content}
          </div>
        </div>

        {/* Rodapé do comentário */}
        <div className="mt-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-500 hover:text-white h-8 text-xs hover:bg-white/5" 
                onClick={() => setIsReplying(!isReplying)}
            >
                <MessageSquare className="w-3 h-3 mr-2" /> Responder
            </Button>
            
            {/* Exemplo de botão de apagar se for o dono (Opcional) */}
            {/* {currentUserId === comment.user.id && (
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 h-8 text-xs">
                    Apagar
                </Button>
            )} */}
          </div>
          
          <ReportButton commentId={comment.id} />
        </div>

        {/* Formulário de Resposta */}
        {isReplying && (
          <div className="mt-4 pl-2 animate-in fade-in slide-in-from-top-2">
            <div className="border-l-2 border-[#27272a] pl-4">
               <CommentForm 
                 workId={workId} 
                 postId={postId} 
                 parentId={comment.id} 
                 onSuccess={() => setIsReplying(false)} 
               />
            </div>
          </div>
        )}

        {/* Respostas Aninhadas */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-6 border-l-2 border-[#27272a] space-y-6">
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                workId={workId} 
                postId={postId}
                currentUserId={currentUserId} // <--- IMPORTANTE: Repassar o ID para as respostas
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
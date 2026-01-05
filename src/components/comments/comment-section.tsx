import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { Prisma } from "@prisma/client";
import { MessageSquare } from "lucide-react";

// Definição de Tipos
const commentUserSelect = {
  select: {
    name: true,
    image: true,
    equippedAvatarFrame: true,
    equippedCommentBackground: true,
  }
};

const commentWithReplies = Prisma.validator<Prisma.CommentDefaultArgs>()({
  include: {
    user: commentUserSelect,
    replies: {
      include: {
        user: commentUserSelect,
        replies: {
          include: {
            user: commentUserSelect,
            replies: {
              include: { user: commentUserSelect }
            }
          }
        }
      }
    }
  }
});

export type CommentWithUser = Prisma.CommentGetPayload<typeof commentWithReplies>;

interface CommentSectionProps {
  workId?: string;
  postId?: string;
}

export async function CommentSection({ workId, postId }: CommentSectionProps) {
  const session = await auth();

  const whereCondition = {
    parentId: null, // Busca apenas comentários de nível superior
    ...(workId && { workId }),
    ...(postId && { postId }),
  };
  
  // Condição para a contagem total (inclui respostas)
  const totalCountWhereCondition = {
    ...(workId && { workId }),
    ...(postId && { postId }),
  };

  const [comments, totalComments] = await Promise.all([
    // Busca os comentários para exibir (só os principais)
    prisma.comment.findMany({
      where: whereCondition,
      ...commentWithReplies,
      orderBy: { createdAt: 'desc' }
    }),
    // Faz uma contagem separada de TODOS os comentários e respostas
    prisma.comment.count({ where: totalCountWhereCondition })
  ]);

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-2xl p-6 md:p-8">
      {/* CORREÇÃO: Usa 'totalComments' para o contador do título */}
      <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-[#FFD700]" />
        Comentários ({totalComments})
      </h3>
      
      {session?.user ? (
        <div className="mb-12">
          <CommentForm workId={workId} postId={postId} />
        </div>
      ) : (
        <div className="text-center text-zinc-500 mb-12 py-8 bg-[#111] border border-dashed border-[#27272a] rounded-xl">
          <p>Você precisa estar <a href="/login" className="text-[#FFD700] underline font-bold">logado</a> para comentar.</p>
        </div>
      )}

      <div className="space-y-8">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} workId={workId} postId={postId} />
        ))}
        {comments.length === 0 && (
           <p className="text-center text-zinc-600 py-10">Seja o primeiro a comentar!</p>
        )}
      </div>
    </div>
  );
}
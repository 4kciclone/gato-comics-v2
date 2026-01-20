import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { Prisma } from "@prisma/client";
import { MessageSquare } from "lucide-react";

// Definição de Tipos para incluir dados do perfil (Cosméticos)
const commentUserSelect = {
  select: {
    id: true,
    name: true,
    image: true,
    equippedAvatarFrame: { select: { imageUrl: true } },
    equippedCommentBackground: { select: { imageUrl: true } },
  }
};

// Validador do Prisma para garantir a tipagem recursiva (Respostas)
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
  const currentUserId = session?.user?.id;

  const whereCondition = {
    parentId: null, // Busca apenas comentários de nível superior (Raiz)
    ...(workId && { workId }),
    ...(postId && { postId }),
  };
  
  const totalCountWhereCondition = {
    ...(workId && { workId }),
    ...(postId && { postId }),
  };

  const [comments, totalComments] = await Promise.all([
    prisma.comment.findMany({
      where: whereCondition,
      ...commentWithReplies,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.comment.count({ where: totalCountWhereCondition })
  ]);

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-2xl p-6 md:p-8">
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
          <CommentItem 
            key={comment.id} 
            comment={comment as any} 
            workId={workId} 
            postId={postId}
            currentUserId={currentUserId} // Passamos o ID para permitir deletar
          />
        ))}
        {comments.length === 0 && (
           <div className="text-center py-10">
              <p className="text-zinc-600">Seja o primeiro a comentar!</p>
           </div>
        )}
      </div>
    </div>
  );
}
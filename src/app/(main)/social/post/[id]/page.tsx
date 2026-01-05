import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard, type PostWithMeta } from "@/components/social/post-card";
import { CommentSection } from "@/components/comments/comment-section";
import { ArrowLeft } from "lucide-react";
import { Prisma } from "@prisma/client";

interface PostPageProps {
  params: { id: string };
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = params;
  const session = await auth();
  const userId = session?.user?.id;

  // Função interna para buscar o post principal e suas respostas
  const getPostWithReplies = async (postId: string) => {
    // Objeto 'include' reutilizável
    const postInclude = Prisma.validator<Prisma.PostInclude>()({
        user: { 
            // CORREÇÃO: Adicionados 'id' e 'username'
            select: { 
                id: true, 
                name: true, 
                username: true, 
                image: true, 
                equippedAvatarFrame: { select: { imageUrl: true } } 
            } 
        },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: userId || "" } },
    });

    const postData = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        ...postInclude,
        // Mantemos a busca de replies aqui, que também precisa do include
        replies: {
          orderBy: { createdAt: 'asc' },
          include: postInclude
        }
      }
    });

    if (!postData) return null;

    const mainPost: PostWithMeta = { ...postData, isLiked: postData.likes.length > 0 };
    
    // O Prisma/TS pode se confundir com o tipo aninhado, então adicionamos uma verificação.
    // Agora o `map` não é mais necessário aqui pois a refatoração unificou o Comment System
    return { mainPost, replies: [] }; // As 'respostas' agora são 'comentários'
  };

  const data = await getPostWithReplies(id);

  if (!data) {
    return notFound();
  }

  const { mainPost } = data;

  return (
    <div>
      {/* Header com botão de Voltar */}
      <div className="sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10 border-b border-[#27272a] p-4 flex items-center gap-4">
        <Link href="/social" aria-label="Voltar para a timeline">
          <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
        </Link>
        <h2 className="text-xl font-bold text-white">Post</h2>
      </div>

      {/* Renderiza o Post Principal em destaque */}
      <PostCard post={mainPost} />
      
      {/* 
        A lógica de 'Respostas' foi movida e unificada para dentro do 'CommentSection',
        pois as respostas agora são Comentários ligados ao Post.
      */}
      <div className="p-4 md:p-6">
        <CommentSection postId={mainPost.id} />
      </div>

    </div>
  );
}
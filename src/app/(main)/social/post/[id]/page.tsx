import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard, type PostWithMeta } from "@/components/social/post-card";
// Importa a seção de comentários completa
import { CommentSection } from "@/components/comments/comment-section";
import { ArrowLeft } from "lucide-react";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // Busca o Post principal
  const postData = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true, equippedAvatarFrame: { select: { imageUrl: true } } } },
      _count: { select: { likes: true, replies: true } },
      likes: { where: { userId: userId || "" } },
    }
  });

  if (!postData) {
    return notFound();
  }

  const mainPost: PostWithMeta = { ...postData, isLiked: postData.likes.length > 0 };

  return (
    <div>
      {/* Header com botão de Voltar */}
      <div className="sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10 border-b border-[#27272a] p-4 flex items-center gap-4">
        <Link href="/social" aria-label="Voltar para a timeline">
          <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
        </Link>
        <h2 className="text-xl font-bold text-white">Post</h2>
      </div>

      {/* Renderiza o Post Principal */}
      <PostCard post={mainPost} />
      
      {/* 
        SEÇÃO DE COMENTÁRIOS UNIFICADA
        Reutilizamos o componente 'CommentSection', passando o 'postId' como contexto.
        Ele cuidará de buscar e renderizar os comentários e o formulário de resposta.
      */}
      <div className="p-4 md:p-6">
        <CommentSection postId={mainPost.id} />
      </div>
    </div>
  );
}
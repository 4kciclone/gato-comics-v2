import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard, type PostWithMeta } from "@/components/social/post-card";
import { CommentSection } from "@/components/comments/comment-section";
import { ArrowLeft } from "lucide-react";
import { Prisma } from "@prisma/client";

// Tipagem correta para a prop 'params' em Server Components
interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  // CORREÇÃO: Usamos 'await' para extrair o 'id' da Promise
  const { id } = await params;
  
  const session = await auth();
  const userId = session?.user?.id;

  // A função para buscar os dados agora receberá um 'id' válido
  const getPostWithData = async (postId: string) => {
    const postInclude = Prisma.validator<Prisma.PostInclude>()({
        user: { 
            select: { 
                id: true, name: true, username: true, image: true, 
                equippedAvatarFrame: { select: { imageUrl: true } } 
            } 
        },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: userId || "" } },
    });

    const postData = await prisma.post.findUnique({
      where: { id: postId },
      include: postInclude
    });

    if (!postData || !postData.user) return null;

    const mainPost: PostWithMeta = { ...postData, isLiked: postData.likes.length > 0 };
    
    return { mainPost };
  };

  const data = await getPostWithData(id);

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
      
      {/* A seção de comentários busca seus próprios dados */}
      <div className="p-4 md:p-6">
        <CommentSection postId={mainPost.id} />
      </div>
    </div>
  );
}
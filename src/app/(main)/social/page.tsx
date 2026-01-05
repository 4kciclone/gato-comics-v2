import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SocialPageClient } from "@/components/social/social-page-client";
import { PostWithMeta } from "@/components/social/post-card";
import { Prisma } from "@prisma/client";

const POSTS_PER_PAGE = 20;

// Objeto de 'include' reutilizável para DRY (Don't Repeat Yourself)
const postIncludeQuery = (userId: string) => Prisma.validator<Prisma.PostInclude>()({
    user: { select: { id: true, name: true, username: true, image: true, equippedAvatarFrame: { select: { imageUrl: true } } } },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId } },
});

// Função helper para mapear os dados do Prisma para o formato esperado pelo PostCard
const mapPosts = (posts: any[]): PostWithMeta[] => {
    return posts.map(p => ({
        ...p,
        isLiked: p.likes.length > 0,
    }));
};

export default async function SocialPage() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return redirect("/login");
    }

    const include = postIncludeQuery(userId);

    // Busca os dados iniciais para AMBOS os feeds em paralelo
    const [globalPostsData, followingPostsData] = await Promise.all([
        // Feed Global: busca os últimos posts de todos os usuários
        prisma.post.findMany({
            where: { parentId: null },
            orderBy: { createdAt: 'desc' },
            take: POSTS_PER_PAGE,
            include: include
        }),
        // Feed "Seguindo": busca os últimos posts apenas dos usuários que a sessão atual segue
        prisma.post.findMany({
            where: {
                parentId: null,
                user: {
                    followers: { some: { followerId: userId } }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: POSTS_PER_PAGE,
            include: include
        })
    ]);

    const userAvatarUrl = session.user.image || `https://ui-avatars.com/api/?name=${session.user.name || 'G'}`;

    // Passa os dados pré-buscados para o componente cliente
    return (
        <SocialPageClient 
            initialGlobalPosts={mapPosts(globalPostsData)} 
            initialFollowingPosts={mapPosts(followingPostsData)}
            userAvatar={userAvatarUrl}
        />
    );
}
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
        equippedAvatarFrame: true,
        equippedProfileBanner: true,
    }
  });

  if (!user) return notFound();

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* BANNER DO PERFIL */}
      <div className="relative h-48 md:h-64 bg-zinc-900 w-full overflow-hidden">
        {user.equippedProfileBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
                src={user.equippedProfileBanner.imageUrl} 
                alt="Banner" 
                className="w-full h-full object-cover"
            />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/20 to-zinc-900" />
        )}
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="relative -mt-16 mb-6 flex flex-col md:flex-row items-end gap-6">
            {/* AVATAR */}
            <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-[#050505] shadow-xl bg-[#111]">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="text-4xl bg-[#FFD700] text-black font-bold">
                        {user.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {/* Moldura */}
                {user.equippedAvatarFrame && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                        src={user.equippedAvatarFrame.imageUrl} 
                        alt="Frame" 
                        className="absolute -top-4 -left-4 w-40 h-40 pointer-events-none z-10"
                    />
                )}
            </div>

            {/* INFO */}
            <div className="flex-1 mb-2 space-y-1">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
                    {user.name}
                    {user.role === "ADMIN" && <Badge className="bg-red-600">ADMIN</Badge>}
                    {user.role === "OWNER" && <Badge className="bg-[#FFD700] text-black">DONO</Badge>}
                </h1>
                <p className="text-zinc-400 font-mono">@{user.username}</p>
            </div>

            <div className="mb-4">
                 <div className="flex items-center gap-2 text-zinc-500 text-sm bg-[#111] px-3 py-1 rounded-full border border-[#27272a]">
                    <CalendarDays className="w-4 h-4" />
                    <span>Desde {user.createdAt.toLocaleDateString('pt-BR')}</span>
                 </div>
            </div>
        </div>

        {/* ESTATÍSTICAS (SÓ VISÍVEL PARA O DONO) */}
        {isOwnProfile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-[#111] border border-[#27272a] rounded-xl p-6">
                    <h3 className="font-bold text-[#FFD700] mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5" /> Carteira
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-[#27272a] pb-2">
                            <span className="text-zinc-400">Patinhas Lite</span>
                            {/* Cálculo manual das patinhas lite não expiradas (simplificado para exibição) */}
                            <span className="font-bold text-white">Ver no menu</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-zinc-400">Patinhas Premium</span>
                            <span className="font-bold text-[#FFD700]">{user.balancePremium}</span>
                        </div>
                    </div>
                </div>
                
                <div className="md:col-span-2 bg-[#111] border border-[#27272a] rounded-xl p-6 flex items-center justify-center text-zinc-500">
                    <p>Histórico de leitura e conquistas aparecerão aqui em breve.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
"use client"; // Precisa ser cliente para usar hooks de Tooltip, se adicionados

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Award } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Tipos para os dados do usuário e do nível
interface UserProfile {
    name: string | null;
    username: string | null;
    image: string | null;
    createdAt: Date;
    equippedAvatarFrame?: { imageUrl: string } | null;
    equippedProfileBanner?: { imageUrl: string } | null;
}

interface LevelInfo {
    level: number;
    currentXp: number;
    nextLevelXp: number;
    progress: number;
    rank: string;
}

interface ProfileHeaderProps {
    user: UserProfile;
    levelInfo: LevelInfo;
}

export function ProfileHeader({ user, levelInfo }: ProfileHeaderProps) {
    const userAvatarUrl = user.image || `https://ui-avatars.com/api/?name=${user.name || 'G'}`;
    const frameUrl = user.equippedAvatarFrame?.imageUrl;
    const bannerUrl = user.equippedProfileBanner?.imageUrl || "https://images.unsplash.com/photo-1576085898323-218335e23c21?q=80&w=2000&auto=format&fit=crop"; // Banner genérico

    return (
        <TooltipProvider>
            <div className="relative mb-24 md:mb-16">
                {/* BANNER */}
                <div className="h-48 md:h-56 w-full rounded-2xl bg-cover bg-center border border-zinc-800" style={{ backgroundImage: `url(${bannerUrl})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent rounded-2xl" />
                </div>

                {/* CONTEÚDO SOBREPOSTO */}
                <div className="md:absolute md:-bottom-12 md:left-10 w-full mt-[-80px] md:mt-0 flex justify-center md:justify-start">
                    <div className="flex flex-col items-center md:flex-row md:items-end gap-4">
                        {/* Avatar com Moldura */}
                        <div className="relative w-32 h-32 md:w-36 md:h-36 shrink-0">
                            <Avatar className="w-full h-full border-4 border-[#0a0a0a] rounded-full shadow-2xl">
                                <AvatarImage src={userAvatarUrl} />
                                <AvatarFallback className="text-4xl font-bold bg-zinc-800">
                                    {user.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {frameUrl && (
                                <img src={frameUrl} alt="Moldura" className="absolute -inset-1 md:-inset-2 w-36 h-36 md:w-40 md:h-40 pointer-events-none" />
                            )}
                        </div>
                        
                        {/* Informações do Usuário */}
                        <div className="flex flex-col gap-1 items-center md:items-start pb-2">
                            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                            <p className="text-zinc-500">@{user.username}</p>
                            <div className="flex items-center pt-1 gap-4 text-xs md:text-sm text-zinc-500">
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Brasil</span>
                                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barra de XP/Nível */}
                <div className="absolute bottom-4 right-6 hidden md:block w-64">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-yellow-400 flex items-center gap-1"><Award className="w-3 h-3"/> {levelInfo.rank}</span>
                                    <span className="text-xs text-zinc-500">Nível {levelInfo.level}</span>
                                </div>
                                <Progress value={levelInfo.progress} className="h-2 bg-zinc-800" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{levelInfo.currentXp} / {levelInfo.nextLevelXp} XP</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    );
}
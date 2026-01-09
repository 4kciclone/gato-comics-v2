import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
    UserPlus, 
    CreditCard, 
    BookUp, 
    ShieldAlert, 
    TrendingUp, 
    ArrowRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ActivityType } from "@prisma/client";

const iconMap: Record<ActivityType, React.ElementType> = {
    NEW_USER: UserPlus,
    NEW_SUBSCRIPTION: CreditCard,
    NEW_CHAPTER: BookUp,
    NEW_REPORT: ShieldAlert,
    POPULAR_POST: TrendingUp,
};

const colorMap: Record<ActivityType, string> = {
    NEW_USER: "text-blue-500",
    NEW_SUBSCRIPTION: "text-green-500",
    NEW_CHAPTER: "text-purple-500",
    NEW_REPORT: "text-red-500",
    POPULAR_POST: "text-yellow-500",
};

export async function ActivityFeed() {
    const activities = await prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    return (
        <div className="space-y-4">
            {activities.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">Nenhuma atividade recente.</p>
            ) : (
                activities.map((activity) => {
                    const Icon = iconMap[activity.type];
                    const color = colorMap[activity.type];

                    return (
                        <div key={activity.id} className="flex items-start gap-4">
                            <div className={cn("mt-1 p-2 bg-zinc-800 rounded-full", color)}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-zinc-300">{activity.message}</p>
                                <div className="flex items-center justify-between text-xs text-zinc-500 mt-1">
                                    <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ptBR })}</span>
                                    {activity.link && (
                                        <Link href={activity.link} className="hover:text-[#FFD700] flex items-center gap-1">
                                            Ver <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
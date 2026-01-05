import { getTrendingTopics } from "@/actions/social";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

export async function TrendingTopics() {
  const topics = await getTrendingTopics();

  return (
    <div className="bg-[#111] border border-[#27272a] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#FFD700]" />
        <h3 className="font-bold text-white">O que está bombando</h3>
      </div>
      
      {topics.length > 0 ? (
        <div className="space-y-3 text-sm">
          {topics.map((topic, index) => (
            <Link 
              key={topic} 
              href={`/busca?q=${topic.replace('#', '')}`} 
              className="block group"
            >
              <p className="text-zinc-500 text-xs">Tópico #{index + 1}</p>
              <p className="font-bold text-white group-hover:underline">{topic}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Nenhum tópico em alta no momento.</p>
      )}
    </div>
  );
}
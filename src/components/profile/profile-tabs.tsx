"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Gem, BarChart2, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
    { value: "library", label: "Biblioteca", icon: BookOpen },
    { value: "inventory", label: "Inventário", icon: Gem },
    { value: "stats", label: "Estatísticas", icon: BarChart2 },
    { value: "wallet", label: "Extrato", icon: History },
    { value: "settings", label: "Configurações", icon: Settings, disabled: true },
];

export function ProfileTabs({ defaultValue }: { defaultValue: string }) {
    return (
        <div className="relative overflow-x-auto scrollbar-hide mb-8 flex justify-center sm:justify-start">
            <TabsList className="inline-flex h-auto bg-transparent p-0">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        disabled={tab.disabled}
                        className={cn(
                            "relative h-12 px-5 rounded-full text-zinc-400 font-bold text-sm transition-colors duration-300",
                            "hover:text-white data-[state=active]:bg-zinc-800 data-[state=active]:text-white",
                            "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>
    );
}
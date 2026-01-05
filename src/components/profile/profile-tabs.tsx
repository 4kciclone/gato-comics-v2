"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Gem, BarChart2, History, Settings } from "lucide-react";
import { motion } from "framer-motion"; // Se instalou
import { useState } from "react";

const tabs = [
    { value: "library", label: "Biblioteca", icon: BookOpen },
    { value: "inventory", label: "Inventário", icon: Gem },
    { value: "stats", label: "Estatísticas", icon: BarChart2 },
    { value: "wallet", label: "Extrato", icon: History },
    { value: "settings", label: "Configurações", icon: Settings, disabled: true },
];

export function ProfileTabs() {
    const [activeTab, setActiveTab] = useState("library");

    return (
        <div className="relative overflow-x-auto scrollbar-hide mb-8">
            {/* Usamos 'inline-flex' para que o container tenha a largura do conteúdo */}
            <TabsList className="relative inline-flex items-center justify-start bg-[#111111] border border-[#27272a] h-14 p-1 rounded-full">
                {tabs.map((tab) => (
                    <TabsTrigger 
                        key={tab.value}
                        value={tab.value}
                        disabled={tab.disabled}
                        onClick={() => setActiveTab(tab.value)}
                        className="relative h-full px-6 rounded-full data-[state=active]:text-black text-zinc-400 font-bold text-sm transition-colors duration-300 hover:text-white"
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>
    );
}
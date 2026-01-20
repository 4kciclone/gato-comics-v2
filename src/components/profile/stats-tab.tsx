"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BookOpen, Gem } from 'lucide-react';

// Tipos de dados que o componente receberá do servidor
interface StatsData {
    totalChaptersRead: number;
    genreDistribution: { name: string; value: number }[];
    activityLast7Days: { date: string; chapters: number }[];
    rarestCosmetic?: { name: string; rarity: string };
    favoriteWork?: string; // NOVO CAMPO
}

const COLORS = ['#FFD700', '#8A2BE2', '#1E90FF', '#32CD32', '#FF4500'];

export function StatsTab({ data }: { data: StatsData }) {
    return (
        <div className="space-y-8 animate-in fade-in-50">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-[#111] border-[#27272a]">
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Capítulos Lidos</CardTitle>
                        <BookOpen className="w-4 h-4 text-zinc-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{data.totalChaptersRead}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-[#111] border-[#27272a]">
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Conquista Rara</CardTitle>
                        <Gem className="w-4 h-4 text-purple-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white truncate">{data.rarestCosmetic?.name || 'Nenhuma'}</div>
                    </CardContent>
                </Card>
                
                <Card className="bg-[#111] border-[#27272a]">
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Obra Favorita</CardTitle>
                        <Award className="w-4 h-4 text-yellow-500"/>
                    </CardHeader>
                    <CardContent>
                        {/* AQUI ESTÁ A MUDANÇA: Dados reais ou fallback */}
                        <div className="text-xl font-bold text-white truncate" title={data.favoriteWork}>
                            {data.favoriteWork || 'Nenhuma lida'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-2 bg-[#111] border-[#27272a]">
                    <CardHeader><CardTitle>Gêneros Mais Lidos</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.genreDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                    {data.genreDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #27272a' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3 bg-[#111] border-[#27272a]">
                    <CardHeader><CardTitle>Atividade Recente</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.activityLast7Days}>
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #27272a' }} cursor={{ fill: '#27272a' }} />
                                <Bar dataKey="chapters" fill="#FFD700" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
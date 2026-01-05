import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, BookOpenCheck, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const revalidate = 60; // Revalida a cada minuto

export default async function AdminDashboard() {
  
  // 1. Busca dos dados reais em paralelo
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [revenueLast30Days, newUsersLast30Days, totalChapters, pendingReports] = await Promise.all([
    // Receita nos últimos 30 dias
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'DEPOSIT', createdAt: { gte: thirtyDaysAgo } },
    }),
    // Novos usuários nos últimos 30 dias
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    // Total de capítulos na plataforma
    prisma.chapter.count(),
    // Denúncias pendentes de moderação
    prisma.report.count({
      where: { status: 'PENDING' },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
      
      {/* Grid de KPIs Reais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="bg-[#111] border-[#27272a] hover:border-[#FFD700]/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Receita (Últimos 30d)</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(revenueLast30Days._sum.amount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#27272a] hover:border-[#FFD700]/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Novos Usuários (Últimos 30d)</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">+{newUsersLast30Days}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111] border-[#27272a] hover:border-[#FFD700]/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Capítulos Totais</CardTitle>
            <BookOpenCheck className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalChapters}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111] border-red-900/50 hover:border-red-500 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Denúncias Pendentes</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{pendingReports}</div>
          </CardContent>
        </Card>

      </div>
      
      {/* Placeholder para os futuros gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="bg-[#111] border-[#27272a]">
           <CardHeader><CardTitle>Novos Usuários (Últimos 7 dias)</CardTitle></CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center text-zinc-600">
             {/* Gráfico de Linha virá aqui */}
             <p>Gráfico em desenvolvimento.</p>
           </CardContent>
         </Card>
         <Card className="bg-[#111] border-[#27272a]">
           <CardHeader><CardTitle>Atividade Recente</CardTitle></CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center text-zinc-600">
              {/* Feed de atividades virá aqui */}
             <p>Feed de atividades em desenvolvimento.</p>
           </CardContent>
         </Card>
      </div>

    </div>
  );
}
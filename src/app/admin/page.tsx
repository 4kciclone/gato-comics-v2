import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, BookOpenCheck, ShieldAlert, ArrowRight, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getFinanceDashboardData } from "@/actions/finance"; // Busca KPIs financeiros
import { getAdminDashboardAnalytics } from "@/actions/admin"; // Busca dados para gráficos
import { NewUsersChart } from "@/components/admin/dashboard/new-users-chart"; // Importa o novo gráfico
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const revalidate = 60; // Revalida a cada minuto

export default async function AdminDashboard() {
  
  const [financeData, analyticsData, totalChapters, pendingReports] = await Promise.all([
    getFinanceDashboardData(), // Renomeado para evitar conflito
    getAdminDashboardAnalytics(),
    prisma.chapter.count(), // Movido para cá para unificar
    prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  const { kpis } = financeData;
  const { newUsersChartData, inactiveWorks } = analyticsData;
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#111] border-[#27272a] hover:border-green-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Receita (Últimos 30d)</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">{formatCurrency(kpis.revenueLast30Days)}</div></CardContent>
        </Card>
        <Card className="bg-[#111] border-[#27272a] hover:border-blue-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Novos Assinantes (Últimos 30d)</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">+{kpis.newSubscribersLast30Days}</div></CardContent>
        </Card>
        <Card className="bg-[#111] border-[#27272a] hover:border-purple-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Capítulos Totais</CardTitle>
            <BookOpenCheck className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">{totalChapters}</div></CardContent>
        </Card>
        <Link href="/admin/moderation">
            <Card className="bg-[#111] border-red-900/50 hover:border-red-500 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Denúncias Pendentes</CardTitle>
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-400">{pendingReports}</div></CardContent>
            </Card>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Gráfico Real de Novos Usuários */}
         <Card className="bg-[#111] border-[#27272a]">
           <CardHeader><CardTitle className="text-white">Novos Usuários (Últimos 7 dias)</CardTitle></CardHeader>
           <CardContent>
             <NewUsersChart data={newUsersChartData} />
           </CardContent>
         </Card>
         
         {/* Tabela de Obras Inativas */}
         <Card className="bg-[#111] border-[#27272a]">
           <CardHeader><CardTitle className="text-white">Obras Precisando de Atenção</CardTitle></CardHeader>
           <CardContent>
             {inactiveWorks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <CheckCircle className="w-8 h-8 mb-2 text-green-500"/>
                    <p>Nenhuma obra inativa. Tudo em dia!</p>
                </div>
             ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800">
                            <TableHead className="text-zinc-400">Obra</TableHead>
                            <TableHead className="text-zinc-400 text-right">Último Capítulo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inactiveWorks.map(work => (
                            <TableRow key={work.id} className="border-zinc-800">
                                <TableCell>
                                    <Link href={`/admin/works/${work.id}`} className="font-medium text-white hover:text-[#FFD700] flex items-center gap-2">
                                        {work.title} <ArrowRight className="w-3 h-3"/>
                                    </Link>
                                </TableCell>
                                <TableCell className="text-right text-sm text-zinc-500">
                                    {work.chapters[0] ? formatDistanceToNow(new Date(work.chapters[0].createdAt), { addSuffix: true, locale: ptBR }) : 'Nunca'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             )}
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
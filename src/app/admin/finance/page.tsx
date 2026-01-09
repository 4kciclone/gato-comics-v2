import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getFinanceDashboardData } from "@/actions/finance";
import { RevenueChart } from "@/components/admin/finance/revenue-chart";
import { DollarSign, UserPlus, Users } from "lucide-react";

export const revalidate = 60;

export default async function FinancePage() {
  // Busca dos dados principais na Action
  const { kpis, revenueChartData } = await getFinanceDashboardData();
  
  // CORREÇÃO: A query das transações recentes agora inclui os dados do usuário
  const recentTransactions = await prisma.transaction.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: { 
        user: { 
            select: { 
                name: true, 
                email: true 
            } 
        } 
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Finanças</h1>
        <p className="text-zinc-400">Visão geral da saúde financeira e econômica da plataforma.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-[#111] border-[#27272a]"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Receita (Últimos 30d)</CardTitle><DollarSign className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{formatCurrency(kpis.revenueLast30Days)}</div></CardContent></Card>
        <Card className="bg-[#111] border-[#27272a]"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Novos Assinantes (Últimos 30d)</CardTitle><UserPlus className="h-4 w-4 text-purple-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">+{kpis.newSubscribersLast30Days}</div></CardContent></Card>
        <Card className="bg-[#111] border-[#27272a]"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-zinc-400">ARPU (Receita Média / Usuário)</CardTitle><Users className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{formatCurrency(kpis.arpu)}</div></CardContent></Card>
      </div>

      <Card className="bg-[#111] border-[#27272a]">
        <CardHeader><CardTitle>Receita Diária (Últimos 7 dias)</CardTitle></CardHeader>
        <CardContent>
            <RevenueChart data={revenueChartData as any} />
        </CardContent>
      </Card>

      <Card className="bg-[#111] border-[#27272a]">
        <CardHeader><CardTitle>Transações Recentes</CardTitle><CardDescription>As últimas 15 movimentações na plataforma.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-[#1A1A1A]"><TableHead>Usuário</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Data</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map(tx => (
                <TableRow key={tx.id} className="border-zinc-800">
                  <TableCell>
                    {/* Agora 'tx.user' existe e o código funcionará */}
                    <div className="font-medium text-white">{tx.user.name}</div>
                    <div className="text-xs text-zinc-500">{tx.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       {tx.type === 'DEPOSIT' && <Badge className="bg-green-900/50 text-green-400 border-green-800">Depósito</Badge>}
                       {tx.type === 'SPEND' && <Badge variant="destructive">Gasto</Badge>}
                       {tx.type === 'EARN' && <Badge variant="secondary">Ganho Grátis</Badge>}
                       {tx.type === 'BONUS' && <Badge className="bg-blue-900/50 text-blue-400 border-blue-800">Bônus</Badge>}
                       <span className="text-zinc-300">{tx.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-zinc-300'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} <span className={`ml-1 ${tx.currency === 'PREMIUM' ? 'text-[#FFD700]' : 'text-zinc-600'}`}>{tx.currency[0]}</span>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs">
                    {new Date(tx.createdAt).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
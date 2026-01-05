import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Coins, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Cache: Revalida a cada 5 minutos
export const revalidate = 300;

export default async function FinancePage() {
  // 1. Buscas Agregadas em Paralelo
  const [totalRevenue, totalPremiumSpent, totalLiteSpent, totalUsers] = await Promise.all([
    // Receita Bruta (Soma de todos os depósitos em centavos)
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'DEPOSIT' },
    }),
    // Total de Patinhas Premium gastas
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'SPEND', currency: 'PREMIUM' },
    }),
    // Total de Patinhas Lite gastas
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'SPEND', currency: 'LITE' },
    }),
    // Total de usuários registrados
    prisma.user.count(),
  ]);

  // 2. Últimas Transações
  const recentTransactions = await prisma.transaction.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Finanças</h1>
        <p className="text-zinc-400">Visão geral da saúde financeira e econômica da plataforma.</p>
      </div>

      {/* Grid de KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#111] border-[#27272a]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Receita Bruta (Stripe)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalRevenue._sum.amount || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-[#27272a]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Patinhas Premium Gastas</CardTitle>
            <Coins className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Math.abs(totalPremiumSpent._sum.amount || 0)} 🐾
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-[#27272a]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Patinhas Lite Gastas</CardTitle>
            <Coins className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Math.abs(totalLiteSpent._sum.amount || 0)} 🐾
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-[#27272a]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações Recentes */}
      <Card className="bg-[#111] border-[#27272a]">
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>As últimas 15 movimentações na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-[#1A1A1A]">
                <TableHead className="text-zinc-400">Usuário</TableHead>
                <TableHead className="text-zinc-400">Descrição</TableHead>
                <TableHead className="text-zinc-400 text-right">Valor</TableHead>
                <TableHead className="text-zinc-400">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map(tx => (
                <TableRow key={tx.id} className="border-zinc-800">
                  <TableCell>
                    <div className="font-medium text-white">{tx.user.name}</div>
                    <div className="text-xs text-zinc-500">{tx.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       {tx.type === 'DEPOSIT' && <Badge className="bg-green-900/50 text-green-400 border-green-800">Depósito</Badge>}
                       {tx.type === 'SPEND' && <Badge variant="destructive">Gasto</Badge>}
                       {tx.type === 'EARN' && <Badge variant="secondary">Ganho Grátis</Badge>}
                       <span className="text-zinc-300">{tx.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-zinc-300'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} 
                    <span className={`ml-1 ${tx.currency === 'PREMIUM' ? 'text-[#FFD700]' : 'text-zinc-600'}`}>
                      {tx.currency === 'PREMIUM' ? 'P' : 'L'}
                    </span>
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
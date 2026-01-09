"use server";

import { prisma } from "@/lib/prisma";

/**
 * Busca todos os dados agregados para o dashboard de finanças.
 */
export async function getFinanceDashboardData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Buscas para os KPIs
  const [
    revenueLast30DaysData,
    newSubscribersLast30Days,
    totalUsers,
    totalRevenueData,
  ] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'DEPOSIT', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { subscriptionTier: { not: null }, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count(),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'DEPOSIT' } }),
  ]);

  const totalRevenue = totalRevenueData._sum.amount || 0;
  const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

  const kpis = {
    revenueLast30Days: revenueLast30DaysData._sum.amount || 0,
    newSubscribersLast30Days,
    arpu,
  };

  // 2. Busca para o gráfico de Receita Diária (últimos 7 dias)
  const dailyRevenue = await prisma.$queryRaw< { date: string; total: number }[] >`
    SELECT 
      TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') as date,
      SUM(amount) as total
    FROM "transactions"
    WHERE 
      type = 'DEPOSIT' AND "createdAt" >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY date ASC;
  `;

  // Formata os dados para o gráfico
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const revenueChartData = last7Days.map(date => {
    const dayData = dailyRevenue.find(d => d.date.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      Receita: dayData ? Number(dayData.total) / 100 : 0, // Converte para Reais
    };
  });

  return { kpis, revenueChartData };
}
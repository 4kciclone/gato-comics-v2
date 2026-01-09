"use server";

import { prisma } from "@/lib/prisma";

/**
 * Busca dados para o gráfico de novos usuários e para a tabela de obras inativas.
 */
export async function getAdminDashboardAnalytics() {
  
  // --- DADOS PARA O GRÁFICO DE NOVOS USUÁRIOS (ÚLTIMOS 7 DIAS) ---
  
  // Usamos SQL puro (via $queryRaw) pois é mais eficiente para agrupar por dia
  const newUsersLast7DaysData = await prisma.$queryRaw< { date: string; count: BigInt }[] >`
    SELECT 
      TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') as date,
      COUNT(id) as count
    FROM "users"
    WHERE "createdAt" >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY date ASC;
  `;

  // Formata os dados para o gráfico Recharts, preenchendo dias vazios com 0
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const newUsersChartData = last7Days.map(date => {
    const dayData = newUsersLast7DaysData.find(d => d.date.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), // Ex: "seg"
      "Novos Usuários": dayData ? Number(dayData.count) : 0,
    };
  });


  // --- DADOS PARA A TABELA DE OBRAS INATIVAS ---

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Busca obras que não têm capítulos ou cujo último capítulo é mais antigo que 30 dias
  const inactiveWorks = await prisma.work.findMany({
    where: {
        chapters: {
            every: {
                createdAt: {
                    lt: thirtyDaysAgo
                }
            }
        }
    },
    select: {
        id: true,
        title: true,
        slug: true,
        chapters: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true }
        }
    },
    take: 5 // Limita a 5 para não poluir o dashboard
  });

  return { newUsersChartData, inactiveWorks };
}
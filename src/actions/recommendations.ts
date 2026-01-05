"use server";

import { prisma } from "@/lib/prisma";

const RECOMMENDATION_LIMIT = 10; // Número de obras a serem recomendadas

/**
 * Busca recomendações de obras para um usuário com base em uma obra de referência.
 * Lógica: "Pessoas que leram A também leram B, C e D".
 * 
 * @param workId - O ID da obra que serve como ponto de partida para a recomendação.
 * @param userId - O ID do usuário logado, para filtrar obras que ele já leu.
 * @returns Uma lista de obras recomendadas.
 */
export async function getRecommendations(workId: string, userId?: string) {
    try {
        // --- Fallback (Plano B): Se não houver dados suficientes, recomenda as mais favoritadas ---
        const fallbackRecommendations = async () => {
            return await prisma.work.findMany({
                where: { 
                    isHidden: false,
                    NOT: { id: workId } // Exclui a obra atual
                },
                orderBy: { 
                    likes: { _count: 'desc' } 
                },
                take: RECOMMENDATION_LIMIT,
            });
        };

        // 1. Encontrar outros usuários que também leram a obra de referência.
        const similarUsers = await prisma.libraryEntry.findMany({
            where: {
                workId,
                NOT: { userId: userId }, // Exclui o próprio usuário
            },
            select: { userId: true },
            take: 50, // Pega uma amostra de 50 leitores para manter a query performática
        });

        const similarUserIds = similarUsers.map(u => u.userId);

        // Se não houver leitores suficientes para comparar, usa o fallback.
        if (similarUserIds.length < 5) {
            return fallbackRecommendations();
        }

        // 2. Desses usuários, encontrar todas as outras obras que eles leram.
        const recommendedWorkEntries = await prisma.libraryEntry.findMany({
            where: {
                userId: { in: similarUserIds },
                NOT: { workId: workId }, // Exclui a obra de referência
            },
            select: { workId: true }
        });

        // 3. Contar a frequência de cada obra recomendada.
        const workIdCounts = recommendedWorkEntries.reduce((acc, entry) => {
            acc[entry.workId] = (acc[entry.workId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Transforma o objeto de contagem em um array ordenado
        const sortedWorkIds = Object.entries(workIdCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([id]) => id);

        // Se o algoritmo não encontrou recomendações suficientes, usa o fallback.
        if (sortedWorkIds.length === 0) {
            return fallbackRecommendations();
        }
        
        // 4. Buscar os dados completos das obras recomendadas e filtrar as que o usuário atual já leu.
        const recommendations = await prisma.work.findMany({
            where: {
                id: { in: sortedWorkIds },
                isHidden: false,
                // Filtro para garantir que não recomendamos algo que o usuário já está lendo ou leu.
                ...(userId && { 
                    libraryEntries: {
                        none: { userId }
                    }
                })
            },
            take: RECOMMENDATION_LIMIT
        });

        // Garante que o resultado final respeite a ordem de popularidade calculada
        const finalRecommendations = recommendations
            .sort((a, b) => sortedWorkIds.indexOf(a.id) - sortedWorkIds.indexOf(b.id));

        return finalRecommendations;

    } catch (error) {
        console.error("Erro ao buscar recomendações:", error);
        return []; // Retorna um array vazio em caso de erro.
    }
}
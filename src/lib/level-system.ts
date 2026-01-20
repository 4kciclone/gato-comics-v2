// src/lib/level-system.ts

export interface LevelInfo {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
  rank: string;
}

export const calculateLevelInfo = (xp: number): LevelInfo => {
  if (xp < 100) return { level: 1, currentXp: xp, nextLevelXp: 100, progress: (xp / 100) * 100, rank: "Leitor Novato" };
  
  const level = Math.floor(Math.pow(xp / 100, 0.6)) + 1;
  const xpForCurrentLevel = 100 * Math.pow(level - 1, 1 / 0.6);
  const xpForNextLevel = 100 * Math.pow(level, 1 / 0.6);
  const xpInThisLevel = xp - xpForCurrentLevel;
  const xpToNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progress = (xpInThisLevel / xpToNextLevel) * 100;
  
  let rank = "Leitor Novato";
  if (level >= 10) rank = "Leitor Veterano";
  if (level >= 25) rank = "Mestre das Páginas";
  if (level >= 50) rank = "Lorde dos Mangás";
  
  return { 
    level, 
    currentXp: Math.floor(xpInThisLevel), 
    nextLevelXp: Math.ceil(xpToNextLevel), 
    progress: Math.min(100, Math.max(0, progress)), // Clamp entre 0 e 100
    rank 
  };
};
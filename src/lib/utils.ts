import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Adicione esta função que estava faltando
export function formatCurrency(amount: number, type: 'BRL' | 'COIN' = 'BRL') {
  if (type === 'COIN') return `${amount} 🐾`;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100); // Assume que o valor vem em centavos (padrão Stripe)
}
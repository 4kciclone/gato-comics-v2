"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, LineChart } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ChartData {
    date: string;
    Receita: number;
}

export function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`}/>
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: '#111', 
                    border: '1px solid #27272a', 
                    borderRadius: '0.5rem' 
                }} 
                // CORREÇÃO: Verificamos se o valor não é nulo ou undefined
                formatter={(value: number | undefined, name) => {
                  if (typeof value === 'number') {
                    return [formatCurrency(value * 100), 'Receita'];
                  }
                  return [0, 'Receita']; // Fallback
                }}
                labelStyle={{ color: '#FFD700' }}
            />
            <Line 
                type="monotone" 
                dataKey="Receita" 
                stroke="#FFD700" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#FFD700' }} 
                activeDot={{ r: 6 }} 
            />
        </LineChart>
    </ResponsiveContainer>
  );
}
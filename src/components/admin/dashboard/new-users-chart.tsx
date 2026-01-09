"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartData {
    date: string;
    "Novos Usuários": number;
}

export function NewUsersChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '1px solid #27272a', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#8A2BE2' }}
        />
        <Line 
            type="monotone" 
            dataKey="Novos Usuários" 
            stroke="#8A2BE2" 
            strokeWidth={3}
            dot={{ r: 5, fill: '#8A2BE2' }} 
            activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
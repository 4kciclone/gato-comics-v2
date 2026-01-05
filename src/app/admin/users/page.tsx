import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserActions } from "@/components/admin/users/user-actions";
import { Coins, Shield } from "lucide-react";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50, // Limita a 50 para performance
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Usuários & Patinhas</h1>
        <p className="text-zinc-400">Gerencie sua base de usuários e seus saldos.</p>
      </div>

      <Card className="bg-[#111] border-[#27272a]">
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>Exibindo os últimos 50 usuários registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-[#1A1A1A]">
                <TableHead className="text-zinc-400">Usuário</TableHead>
                <TableHead className="text-zinc-400">Cargo</TableHead>
                <TableHead className="text-zinc-400">Saldo (P/L)</TableHead>
                <TableHead className="text-zinc-400">Data de Registro</TableHead>
                <TableHead className="text-zinc-400 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id} className="border-zinc-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-zinc-800 text-xs">
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-zinc-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <Badge 
                       variant={user.role === 'ADMIN' || user.role === 'OWNER' ? 'default' : 'secondary'}
                       className={
                         user.role === 'OWNER' ? 'bg-yellow-400 text-black' :
                         user.role === 'ADMIN' ? 'bg-purple-600 text-white' : ''
                       }
                     >
                       <Shield className="w-3 h-3 mr-1"/> {user.role}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1 font-mono text-sm text-[#FFD700]">
                        <Coins className="w-3 h-3"/> {user.balancePremium}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-sm text-zinc-500">
                        <Coins className="w-3 h-3"/> {user.balanceLite}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <UserActions user={{ id: user.id, role: user.role }} />
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
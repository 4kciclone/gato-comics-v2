"use client";

import Link from "next/link";
import { LogOut, Settings, User as UserIcon, ShieldAlert, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth"; // Importe sua action de logout

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  // Dados fictícios por enquanto, depois pegaremos do banco real
  balance?: {
    premium: number;
    lite: number;
  };
}

export function UserDropdown({ user, balance = { premium: 0, lite: 5 } }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-[#27272a]">
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback className="bg-[#FFD700] text-black font-bold">
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 align-end force-mount bg-[#111111] border-[#27272a] text-white" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">{user.name}</p>
            <p className="text-xs leading-none text-zinc-400">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        {/* SESSÃO DE ECONOMIA (PATINHAS) */}
        <div className="p-2 bg-[#050505] rounded-md m-2 border border-[#27272a]">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Patinhas Premium
                </span>
                <span className="text-sm font-bold text-[#FFD700]">{balance.premium}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Patinhas Lite
                </span>
                <span className="text-sm font-bold text-blue-400">{balance.lite}</span>
            </div>
            <Link href="/shop" className="w-full mt-2 block">
                <Button size="sm" className="w-full h-7 text-xs bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
                    Comprar Mais
                </Button>
            </Link>
        </div>

        <DropdownMenuSeparator className="bg-[#27272a]" />
        
        <DropdownMenuGroup>
          <DropdownMenuItem className="focus:bg-[#27272a] focus:text-white cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          <Link href="/settings">
            <DropdownMenuItem className="focus:bg-[#27272a] focus:text-white cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
            </DropdownMenuItem>
          </Link>
          {user.role === "ADMIN" && (
             <Link href="/admin">
                <DropdownMenuItem className="focus:bg-[#27272a] focus:text-[#FFD700] cursor-pointer text-[#FFD700]">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    <span>Painel Admin</span>
                </DropdownMenuItem>
             </Link>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-[#27272a]" />
        
        <DropdownMenuItem 
            className="focus:bg-red-900/20 focus:text-red-400 text-red-400 cursor-pointer"
            onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
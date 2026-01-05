"use client";

import Link from "next/link";
import { LogOut, User, CreditCard, Coins } from "lucide-react";
import { signOut } from "next-auth/react";
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

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  balance: {
    premium: number;
    lite: number;
  };
}

export function UserNav({ user, balance }: UserNavProps) {
  return (
    <div className="flex items-center gap-4">
      {/* --- CARTEIRA (Desktop) --- */}
      <div className="hidden md:flex items-center gap-3 bg-[#111111] border border-[#27272a] rounded-full px-4 py-1.5 h-10">
        {/* Patinhas Lite (Grátis) */}
        <div className="flex items-center gap-1.5 border-r border-[#27272a] pr-3" title="Patinhas Lite (Aluguel)">
           <Coins className="w-4 h-4 text-zinc-400" />
           <span className="font-bold text-zinc-300">{balance.lite}</span>
        </div>

        {/* Patinhas Premium (Pagas) */}
        <div className="flex items-center gap-1.5" title="Patinhas Premium (Permanente)">
           <Coins className="w-4 h-4 text-[#FFD700]" />
           <span className="font-bold text-[#FFD700]">{balance.premium}</span>
        </div>

        {/* Botão + (Comprar) */}
        <Link href="/shop"> 
           <div className="ml-2 w-6 h-6 rounded-full bg-[#FFD700] hover:bg-white text-black flex items-center justify-center cursor-pointer transition-colors">
              <span className="font-bold text-xs">+</span>
           </div>
        </Link>
      </div>

      {/* --- DROPDOWN DO USUÁRIO --- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-[#27272a] hover:border-[#FFD700]">
            <span className="font-bold text-[#FFD700]">
                {user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-[#111111] border-[#27272a] text-white" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-white">{user.name}</p>
              <p className="text-xs leading-none text-zinc-400">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#27272a]" />
          
          {/* Mobile Balance Display inside Menu (Só aparece no celular) */}
          <div className="md:hidden p-2 space-y-2">
             <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Lite:</span>
                <span className="text-white font-bold">{balance.lite} 🐾</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-[#FFD700]">Premium:</span>
                <span className="text-[#FFD700] font-bold">{balance.premium} 🐾</span>
             </div>
             <DropdownMenuSeparator className="bg-[#27272a]" />
          </div>

          <DropdownMenuGroup>
            {/* Link para o Perfil */}
            <Link href="/profile">
              <DropdownMenuItem className="focus:bg-[#1A1A1A] focus:text-white cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
            </Link>

            {/* Link para a Loja */}
            <Link href="/shop">
              <DropdownMenuItem className="focus:bg-[#1A1A1A] focus:text-white cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Loja de Patinhas</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="bg-[#27272a]" />
          
          <DropdownMenuItem 
            className="focus:bg-red-900/20 focus:text-red-400 text-red-500 cursor-pointer"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
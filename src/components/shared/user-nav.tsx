"use client";

import Link from "next/link";
import { LogOut, User, CreditCard, Settings } from "lucide-react";
import { logout } from "@/actions/auth"; 
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CurrencyIcon } from "@/components/ui/currency-icon"; // Componente personalizado das moedas
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
      
      {/* --- CARTEIRA (Visível apenas em Desktop) --- */}
      <div className="hidden md:flex items-center gap-3 bg-[#111111] border border-[#27272a] rounded-full px-4 py-1.5 h-10 shadow-sm transition-colors hover:border-zinc-700">
        
        {/* Patinhas Lite (Roxa - Aluguel) */}
        <div className="flex items-center gap-2 border-r border-[#27272a] pr-4" title="Patinhas Lite (Bônus/Aluguel)">
           <CurrencyIcon type="lite" size={18} />
           <span className="font-bold text-zinc-300 text-sm">{balance.lite}</span>
        </div>

        {/* Patinhas Premium (Dourada - Permanente) */}
        <div className="flex items-center gap-2" title="Patinhas Premium (Moeda Paga)">
           <CurrencyIcon type="premium" size={18} />
           <span className="font-bold text-[#FFD700] text-sm">{balance.premium}</span>
        </div>

        {/* Botão + (Ir para a Loja) */}
        <Link href="/shop"> 
           <div className="ml-1 w-6 h-6 rounded-full bg-[#FFD700] hover:bg-white text-black flex items-center justify-center cursor-pointer transition-colors shadow-[0_0_10px_rgba(255,215,0,0.2)] hover:shadow-[0_0_15px_rgba(255,215,0,0.5)]">
              <span className="font-bold text-xs">+</span>
           </div>
        </Link>
      </div>

      {/* --- DROPDOWN DO USUÁRIO --- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-transparent p-0">
            <Avatar className="h-10 w-10 border border-[#27272a] hover:border-[#FFD700] transition-colors">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="bg-[#FFD700] text-black font-bold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-60 bg-[#111111] border-[#27272a] text-white p-2" align="end" forceMount>
          
          {/* Cabeçalho do Menu */}
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none text-white truncate">{user.name}</p>
              <p className="text-xs leading-none text-zinc-500 truncate">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-[#27272a] my-2" />
          
          {/* Saldo Mobile (Só aparece no celular onde a barra superior está oculta) */}
          <div className="md:hidden space-y-2 mb-2 p-2 bg-zinc-900/50 rounded-md border border-zinc-800">
             <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400 flex items-center gap-2">
                    <CurrencyIcon type="lite" size={14} /> Lite
                </span>
                <span className="text-white font-bold">{balance.lite}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-[#FFD700] flex items-center gap-2">
                    <CurrencyIcon type="premium" size={14} /> Premium
                </span>
                <span className="text-[#FFD700] font-bold">{balance.premium}</span>
             </div>
          </div>
          
          {/* Links de Navegação */}
          <DropdownMenuGroup>
            <Link href="/profile">
              <DropdownMenuItem className="focus:bg-[#1A1A1A] focus:text-white cursor-pointer rounded-md p-2">
                <User className="mr-3 h-4 w-4 text-zinc-400" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
            </Link>

            <Link href="/settings">
              <DropdownMenuItem className="focus:bg-[#1A1A1A] focus:text-white cursor-pointer rounded-md p-2">
                <Settings className="mr-3 h-4 w-4 text-zinc-400" />
                <span>Configurações</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="bg-[#27272a] my-2" />
          
          {/* Botão de Sair (Server Action) */}
          <DropdownMenuItem 
            className="focus:bg-red-950/30 focus:text-red-400 text-red-500 cursor-pointer rounded-md p-2"
            onClick={() => logout()}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Sair da conta</span>
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Home, Compass, User, Search, Users, ShoppingBag } from "lucide-react";
import Logo from '../../app/(main)/logo.png';

interface MobileDrawerProps {
  username: string | null;
  isLoggedIn: boolean;
}

export function MobileDrawer({ username, isLoggedIn }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Itens de navegação para o menu
  const navItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/social", label: "Comunidade", icon: Users },
    { href: "/shop", label: "Loja", icon: ShoppingBag },
    //...(username ? [{ href: `/u/${username}`, label: "Perfil Social", icon: User }] : [])
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-black hover:bg-black/10">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="bg-[#FFD700] p-0 w-[85%] sm:w-400px border-r-4 border-black"
        style={{
          backgroundImage: `radial-gradient(#00000033 1px, transparent 1px)`,
          backgroundSize: `8px 8px`,
        }}
      >
        <div className="flex flex-col h-full">
          {/* SEÇÃO SUPERIOR: LOGIN / LOGO */}
          <div className="p-6 bg-black/80 backdrop-blur-sm shadow-lg">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu Gato Comics</SheetTitle>
              <SheetDescription className="sr-only">Navegação principal e acesso à conta.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Card da Logo */}
              <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_#FFD700]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={Logo.src} alt="Gato Comics Logo" className="w-40" />
              </div>
              
              {isLoggedIn ? (
                <p className="text-white font-medium">Bem-vindo, {username}!</p>
              ) : (
                <>
                  <p className="text-zinc-300">Entre para sincronizar seu progresso.</p>
                  <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                    <Button className="w-full bg-[#FFD700] text-black h-12 font-bold text-lg rounded-xl border-2 border-black hover:bg-yellow-300">
                      FAZER LOGIN
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* SEÇÃO INFERIOR: NAVEGAÇÃO */}
          <div className="flex-1 p-6 flex flex-col gap-6">
            {/* Barra de Busca */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input 
                placeholder="O que vamos ler?" 
                className="bg-white text-black border-2 border-black rounded-full h-12 pl-12 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
              />
            </div>

            {/* Links de Navegação */}
            <nav className="space-y-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <div className="flex items-center justify-between p-4 bg-black rounded-xl text-white font-black text-lg uppercase tracking-wider hover:bg-zinc-800 hover:shadow-[4px_4px_0px_#000] transition-all transform hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#FFD700] p-2 rounded-lg text-black">
                        <item.icon className="w-6 h-6" />
                      </div>
                      {item.label}
                    </div>
                    <span className="text-[#FFD700]">&gt;</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
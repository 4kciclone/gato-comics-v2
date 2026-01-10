import Link from "next/link";
import { auth } from "@/lib/auth"; // ou "@/auth"
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Cat, Search, ShoppingBag } from "lucide-react";
import { UserDropdown } from "@/components/auth/user-dropdown"; // O componente que criamos antes

export async function Navbar() {
  const session = await auth();
  
  // Dados iniciais de saldo
  let balance = { premium: 0, lite: 0 };

  // Se estiver logado, buscamos o saldo REAL no banco (não confie apenas na sessão para moedas)
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        balancePremium: true,
        liteCoinBatches: {
          where: { expiresAt: { gt: new Date() } } // Apenas lotes não expirados
        }
      }
    });

    if (user) {
      // Soma todas as patinhas lite válidas
      const liteTotal = user.liteCoinBatches.reduce((acc, batch) => acc + batch.amount, 0);
      
      balance = {
        premium: user.balancePremium,
        lite: liteTotal
      };
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#27272a] bg-[#050505]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* LOGO E LINKS DE NAVEGAÇÃO */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-[#FFD700] hover:opacity-90 transition-opacity">
            <div className="bg-[#FFD700]/10 p-1.5 rounded-full">
               <Cat className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:inline-block">Gato Comics</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <Link href="/obra" className="hover:text-white transition-colors">Obras</Link>
            <Link href="/shop" className="hover:text-white transition-colors flex items-center gap-1">
              Loja <ShoppingBag className="w-3 h-3 mb-0.5" />
            </Link>
          </nav>
        </div>

        {/* BUSCA E AUTH */}
        <div className="flex items-center gap-4">
          <Link href="/busca">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-[#27272a]">
              <Search className="w-5 h-5" />
            </Button>
          </Link>

          {session?.user ? (
            // SE LOGADO: Mostra o Dropdown com Avatar e Saldo
            <UserDropdown user={session.user} balance={balance} />
          ) : (
            // SE DESLOGADO: Botões de Entrar/Registrar
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-[#27272a]">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90">
                  Criar Conta
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
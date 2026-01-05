'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Cat,
  Wallet,
  Palette,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Definição dos itens do menu
const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Loja de Cosméticos",
    href: "/admin/cosmetics",
    icon: Palette,
  },
  {
    title: "Obras (Mangás)",
    href: "/admin/works",
    icon: BookOpen,
  },
  {
    title: "Usuários & Patinhas",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Moderação",
    href: "/admin/moderation",
    icon: ShieldCheck,
  },
  {
    title: "Finanças",
    href: "/admin/finance",
    icon: Wallet,
  },
  {
    title: "Configurações",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-[#050505] text-white font-sans selection:bg-[#FFD700] selection:text-black">
      
      {/* --- SIDEBAR LATERAL --- */}
      <aside className="w-64 fixed inset-y-0 left-0 z-50 bg-[#111111] border-r border-[#27272a] flex flex-col">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-[#27272a]">
          <Cat className="w-6 h-6 text-[#FFD700] mr-2" />
          <span className="font-bold text-lg tracking-tight">
            GATO <span className="text-[#FFD700]">ADMIN</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-[#FFD700]/10 text-[#FFD700] border-l-2 border-[#FFD700]" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 mr-3 transition-colors",
                  isActive ? "text-[#FFD700]" : "text-zinc-500 group-hover:text-white"
                )} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-[#27272a]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-[#FFD700]">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Admin User</span>
              <span className="text-xs text-zinc-500">Owner</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-zinc-400 hover:text-red-400 hover:border-red-900 hover:bg-red-950/20 border-zinc-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Header (Mobile check omitted for now) */}
        <header className="h-16 border-b border-[#27272a] bg-#050505/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
          <div className="text-sm text-zinc-500">
            Painel de Controle / <span className="text-white capitalize">{pathname.split('/').pop() || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank">
              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-[#FFD700]">
                Ver Site
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
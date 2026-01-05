"use client";

import { useState } from "react";
import { Check, Gem, Zap, Sparkles, Crown, Coins, Star, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- SUBMIT BUTTON COM EFEITO ---
export function ShopButton({ price, isSub = false, highlight = false }: { price: number, isSub?: boolean, highlight?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button 
      disabled={pending}
      className={cn(
        "w-full h-12 rounded-xl font-bold text-lg transition-all duration-300 relative overflow-hidden group",
        highlight 
          ? "bg-[#FFD700] text-black hover:bg-[#FFD700] hover:scale-[1.02] shadow-[0_0_20px_rgba(255,215,0,0.4)]" 
          : "bg-[#1A1A1A] text-white hover:bg-[#252525] border border-zinc-700 hover:border-zinc-500"
      )}
    >
      {/* Efeito de brilho passando */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
      
      <span className="relative z-20 flex items-center justify-center gap-2">
        {pending ? <Loader2 className="animate-spin" /> : (
          <>
            {isSub ? "Assinar Agora" : "Comprar"} 
            <span className="text-xs opacity-80 font-normal ml-1">
               ({formatCurrency(price)})
            </span>
          </>
        )}
      </span>
    </Button>
  );
}

// --- CARD DE PACOTE (MOEDAS) ---
interface PackCardProps {
  label: string;
  premium: number;
  lite: number;
  price: number;
  icon: string;
  popular?: boolean;
  legendary?: boolean;
  packId: string;
  action: (formData: FormData) => void;
}

export function PackCard({ label, premium, lite, price, icon, popular, legendary, packId, action }: PackCardProps) {
  // Cores baseadas na raridade
  let glowColor = "group-hover:shadow-zinc-500/20";
  let iconColor = "text-zinc-400";
  let borderColor = "border-zinc-800";
  let bgGradient = "from-[#111] to-[#0a0a0a]";

  if (icon === "bronze") { iconColor = "text-orange-700"; }
  if (icon === "silver") { iconColor = "text-zinc-300"; }
  if (icon === "gold")   { iconColor = "text-yellow-400"; glowColor = "group-hover:shadow-yellow-500/30"; borderColor = "group-hover:border-yellow-500/50"; }
  if (icon === "diamond"){ iconColor = "text-cyan-400"; glowColor = "group-hover:shadow-cyan-500/30"; }
  
  if (popular) { 
    borderColor = "border-[#FFD700]"; 
    glowColor = "shadow-yellow-500/20 group-hover:shadow-yellow-500/40"; 
  }
  
  if (legendary) { 
    borderColor = "border-purple-500"; 
    glowColor = "shadow-purple-500/30 group-hover:shadow-purple-500/50"; 
    bgGradient = "from-[#1a0b2e] to-[#0a0a0a]";
    iconColor = "text-purple-400";
  }

  return (
    <div className={cn(
      "group relative flex flex-col p-1 rounded-2xl transition-all duration-500",
      popular ? "scale-105 z-10" : "hover:scale-[1.02]"
    )}>
      {/* Glow de Fundo */}
      <div className={cn("absolute inset-0 rounded-2xl bg-black shadow-2xl transition-all duration-500", glowColor)} />
      
      {/* Borda Gradiente e Conteúdo */}
      <div className={cn(
        "relative flex flex-col h-full rounded-xl border bg-gradient-to-b p-6 overflow-hidden",
        borderColor, bgGradient
      )}>
        
        {/* Etiquetas */}
        {popular && (
          <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
            Best Seller
          </div>
        )}
        {legendary && (
          <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
            Lendário
          </div>
        )}

        {/* Ícone Flutuante */}
        <div className="flex justify-center mb-6 mt-2">
           <div className={cn("p-4 rounded-full bg-white/5 backdrop-blur-sm ring-1 ring-white/10 relative", iconColor)}>
              <Gem className="w-8 h-8" />
              <div className={cn("absolute inset-0 blur-xl opacity-50", iconColor === 'text-yellow-400' ? 'bg-yellow-500' : 'bg-white')} />
           </div>
        </div>

        <div className="text-center space-y-1 mb-8">
          <h3 className="text-zinc-400 font-medium uppercase tracking-widest text-xs">{label}</h3>
          <div className="text-4xl font-black text-white flex items-center justify-center gap-2">
            {premium} <Coins className="w-6 h-6 text-[#FFD700]" />
          </div>
          {lite > 0 && (
            <div className="inline-flex items-center gap-1 bg-green-900/30 text-green-400 px-2 py-0.5 rounded text-xs font-bold border border-green-900/50">
              <Sparkles className="w-3 h-3" /> +{lite} Bônus Lite
            </div>
          )}
        </div>

        <div className="mt-auto">
          <form action={action}>
              <input type="hidden" name="packId" value={packId} />
              <ShopButton price={price} highlight={popular || legendary} />
          </form>
        </div>
      </div>
    </div>
  );
}

// --- CARD DE ASSINATURA ---
interface SubCardProps {
  label: string;
  price: number;
  monthlyPaws: number;
  discount: number;
  works: number;
  recommended?: boolean;
  subId: string;
  action: (formData: FormData) => void;
}

export function SubscriptionCard({ label, price, monthlyPaws, discount, works, recommended, subId, action }: SubCardProps) {
  return (
    <div className={cn(
      "group relative flex flex-col rounded-2xl transition-all duration-300",
      recommended ? "border-2 border-[#FFD700] bg-[#0f0f0f] scale-105 z-10 shadow-[0_0_40px_rgba(255,215,0,0.15)]" : "border border-zinc-800 bg-[#0a0a0a] hover:border-zinc-600"
    )}>
      {recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
          <Crown className="w-3 h-3" /> Recomendado
        </div>
      )}

      <div className="p-8 flex flex-col h-full">
        <h3 className={cn("text-xl font-black uppercase tracking-tighter mb-4", recommended ? "text-[#FFD700]" : "text-white")}>
          {label}
        </h3>

        <div className="mb-8">
          <div className="flex items-baseline gap-1">
             <span className="text-zinc-500 text-lg">R$</span>
             <span className="text-5xl font-black text-white">{price / 100}</span>
             <span className="text-zinc-500">/mês</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Cancele quando quiser.</p>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
          <ListItem text="Sem Anúncios" highlighted />
          <ListItem text={`${works} Obras à escolha`} />
          <ListItem text={`${monthlyPaws} Patinhas Mensais`} highlightText />
          <ListItem text={`${discount}% de Desconto na Loja`} />
          {recommended && <ListItem text="Acesso Antecipado" icon={<Star className="w-3 h-3 text-[#FFD700]" />} />}
        </ul>

        <form action={action}>
           <input type="hidden" name="subId" value={subId} />
           <ShopButton price={price} isSub highlight={recommended} />
        </form>
      </div>
    </div>
  );
}

function ListItem({ text, highlighted, highlightText, icon }: { text: string, highlighted?: boolean, highlightText?: boolean, icon?: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-3 text-sm", highlighted ? "text-white" : "text-zinc-400")}>
       <div className={cn(
         "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
         highlightText ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-zinc-800 text-zinc-400"
       )}>
         {icon || <Check className="w-3 h-3" />}
       </div>
       <span className={highlightText ? "text-[#FFD700] font-bold" : ""}>{text}</span>
    </li>
  );
}

// --- CONTAINER DE ABAS (CLIENT COMPONENT) ---
export function ShopTabs({ childrenPacks, childrenSubs, childrenCosmetics }: { childrenPacks: React.ReactNode, childrenSubs: React.ReactNode, childrenCosmetics: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<'packs' | 'subs' | 'cosmetics'>('packs');

  // Lógica para a animação do fundo amarelo
  const getSliderStyle = () => {
    switch(activeTab) {
      case 'packs': return { left: '2px', width: '120px' };
      case 'subs': return { left: '126px', width: '145px' };
      case 'cosmetics': return { left: '275px', width: '150px' };
      default: return {};
    }
  };

  return (
    <div className="space-y-12">
      {/* SWITCHER */}
      <div className="flex justify-center">
        <div className="bg-[#111] p-1 rounded-full border border-[#27272a] flex relative">
          <button
            onClick={() => setActiveTab('packs')}
            className={cn(
              "relative z-10 w-[120px] py-2 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2",
              activeTab === 'packs' ? "text-black" : "text-zinc-400 hover:text-white"
            )}
          >
            <Coins className="w-4 h-4" /> Pacotes
          </button>
          <button
            onClick={() => setActiveTab('subs')}
            className={cn(
              "relative z-10 w-[145px] py-2 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2",
              activeTab === 'subs' ? "text-black" : "text-zinc-400 hover:text-white"
            )}
          >
            <Crown className="w-4 h-4" /> Assinaturas
          </button>
          <button
            onClick={() => setActiveTab('cosmetics')}
            className={cn(
              "relative z-10 w-[150px] py-2 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2",
              activeTab === 'cosmetics' ? "text-black" : "text-zinc-400 hover:text-white"
            )}
          >
            <Gem className="w-4 h-4" /> Cosméticos
          </button>
          
          {/* Fundo Animado do Switch */}
          <div 
            className="absolute top-1 bottom-1 bg-[#FFD700] rounded-full transition-all duration-300 ease-out"
            style={getSliderStyle()}
          />
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'packs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
            {childrenPacks}
          </div>
        )}
        {activeTab === 'subs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {childrenSubs}
          </div>
        )}
        {activeTab === 'cosmetics' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {childrenCosmetics}
          </div>
        )}
      </div>
    </div>
  );
}
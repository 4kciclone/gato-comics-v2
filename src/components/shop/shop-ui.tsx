"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  Check,
  Gem,
  Zap,
  Sparkles,
  Crown,
  Coins,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { useFormStatus } from "react-dom";
import type { CoinPackIcon, SubscriptionIcon } from "@/lib/shop-config";

/* =========================================================
 * SHOP BUTTON
 * =======================================================*/
export function ShopButton({
  price,
  isSub = false,
  highlight = false,
}: {
  price: number;
  isSub?: boolean;
  highlight?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending}
      className={cn(
        "w-full h-12 rounded-xl font-bold text-lg transition-all duration-300 relative overflow-hidden group",
        highlight
          ? "bg-[#FFD700] text-black hover:bg-yellow-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,215,0,0.4)]"
          : "bg-[#1A1A1A] text-white hover:bg-[#252525] border border-zinc-700 hover:border-zinc-500"
      )}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent z-10" />
      <span className="relative z-20 flex items-center justify-center gap-2">
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
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

/* =========================================================
 * PACK CARD
 * =======================================================*/
interface PackCardProps {
  label: string;
  premium: number;
  lite: number;
  price: number;
  imagePath: string;
  icon: CoinPackIcon;
  popular?: boolean;
  legendary?: boolean;
  packId: string;
  action: (formData: FormData) => void;
}

export function PackCard({
  label,
  premium,
  lite,
  price,
  imagePath,
  icon,
  popular,
  legendary,
  packId,
  action,
}: PackCardProps) {
  
  let glowColor = "group-hover:shadow-zinc-500/20";
  let borderColor = "border-zinc-800";
  let bgGradient = "from-[#111] to-[#0a0a0a]";
  let textColor = "text-zinc-300";

  switch (icon) {
    case "bronze":
      glowColor = "group-hover:shadow-orange-700/20";
      textColor = "text-orange-600";
      break;
    case "gold":
      glowColor = "group-hover:shadow-yellow-500/30";
      borderColor = "group-hover:border-yellow-500/50";
      textColor = "text-yellow-500";
      break;
    case "diamond":
      glowColor = "group-hover:shadow-cyan-500/30";
      borderColor = "group-hover:border-cyan-500/50";
      textColor = "text-cyan-400";
      break;
    case "legendary":
      glowColor = "shadow-purple-500/30 group-hover:shadow-purple-500/50";
      borderColor = "border-purple-500";
      bgGradient = "from-[#1a0b2e] to-[#0a0a0a]";
      textColor = "text-purple-500";
      break;
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col p-1 rounded-2xl transition-all duration-500",
        popular ? "scale-105 z-10" : "hover:scale-[1.02]"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-2xl bg-black shadow-2xl transition-all duration-500",
          glowColor
        )}
      />

      <div
        className={cn(
          "relative flex flex-col h-full rounded-xl border bg-linear-to-b p-6 overflow-hidden",
          borderColor,
          bgGradient
        )}
      >
        {popular && (
          <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-20">
            Best Seller
          </div>
        )}

        {legendary && (
          <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-20">
            Lendário
          </div>
        )}

        <div className="flex justify-center mb-4 mt-2 relative">
          <div className="relative w-32 h-32 transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl">
             <Image 
                src={imagePath}
                alt={label}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 33vw"
             />
          </div>
          <div className={cn("absolute inset-0 blur-3xl opacity-20 -z-10", textColor.replace('text-', 'bg-'))} />
        </div>

        <div className="text-center space-y-1 mb-8">
          <h3 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">
            {label}
          </h3>
          <div className="text-4xl font-black text-white flex justify-center gap-2 items-center">
            {premium} <span className="text-[#FFD700] text-2xl">🐾</span>
          </div>

          {lite > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-green-900/30 text-green-400 px-2 py-0.5 rounded text-xs font-bold border border-green-900/50 mt-2">
              {/* IMAGEM DA PATINHA LITE AQUI */}
              <Image src="/assets/paw-purple.webp" alt="Lite" width={14} height={14} />
              <span>+{lite} Lite</span>
            </div>
          )}
        </div>

        <form action={action} className="mt-auto relative z-20">
          <input type="hidden" name="packId" value={packId} />
          <ShopButton price={price} highlight={popular || legendary} />
        </form>
      </div>
    </div>
  );
}

/* =========================================================
 * SUBSCRIPTION CARD
 * =======================================================*/
interface SubCardProps {
  label: string;
  price: number;
  monthlyPaws: number;
  discount: number;
  works: number;
  icon?: SubscriptionIcon;
  imagePath: string;
  glowColor?: string;
  recommended?: boolean;
  subId: string;
  action: (formData: FormData) => void;
}

export function SubscriptionCard({
  label,
  price,
  monthlyPaws,
  discount,
  works,
  imagePath,
  glowColor,
  recommended,
  subId,
  action,
}: SubCardProps) {
  
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl transition-all duration-300 overflow-hidden",
        recommended
          ? "border-2 border-[#FFD700] bg-[#0f0f0f] scale-105 z-10 shadow-[0_0_40px_rgba(255,215,0,0.15)]"
          : "border border-zinc-800 bg-[#0a0a0a] hover:border-zinc-600"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-10 transition-opacity", glowColor?.replace("shadow-", "from-").replace("/20", "/5") + " to-transparent")} />

      {recommended && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[10px] font-black px-4 py-1 rounded-b-lg uppercase tracking-widest shadow-lg flex items-center gap-1 z-20">
          <Crown className="w-3 h-3" /> Recomendado
        </div>
      )}

      <div className="p-8 flex flex-col h-full relative z-10">
        
        <div className="flex flex-col items-center mb-6 pt-4">
          <div className="relative w-28 h-28 mb-4 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110">
             <Image 
                src={imagePath}
                alt={label}
                fill
                className="object-contain"
                sizes="150px"
                priority={recommended}
             />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-widest mt-2">
            {label}
          </h3>
        </div>

        <div className="mb-8 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-zinc-500 text-lg">R$</span>
            <span className="text-5xl font-black text-white">
              {Math.floor(price / 100)}
            </span>
            <span className="text-zinc-500">
              ,{(price % 100).toString().padStart(2, "0")}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">/mês • Cancele quando quiser</p>
        </div>

        <ul className="space-y-4 mb-8 flex-1 border-t border-zinc-800/50 pt-6">
          <ListItem text="Sem anúncios" highlighted />
          <ListItem text={`${works} obras à escolha`} icon={<Gem className="w-3 h-3"/>} />
          {/* IMAGEM DA PATINHA LITE AQUI NA LISTA DE BENEFÍCIOS */}
          <ListItem
            text={
                <span className="flex items-center gap-1.5">
                    {monthlyPaws} <Image src="/assets/paw-purple.webp" alt="Lite" width={16} height={16} /> mensais
                </span>
            }
            highlightText
            icon={<Sparkles className="w-3 h-3"/>}
          />
          <ListItem text={`${discount}% de desconto na loja`} />
        </ul>

        <form action={action} className="mt-auto">
          <input type="hidden" name="subId" value={subId} />
          <ShopButton price={price} isSub highlight={recommended} />
        </form>
      </div>
    </div>
  );
}

/* =========================================================
 * LIST ITEM
 * =======================================================*/
function ListItem({
  text,
  highlighted,
  highlightText,
  icon,
}: {
  text: React.ReactNode; // Atualizado para aceitar Componentes (Imagem)
  highlighted?: boolean;
  highlightText?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 text-sm",
        highlighted ? "text-white" : "text-zinc-400"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
          highlightText
            ? "bg-[#FFD700]/20 text-[#FFD700]"
            : "bg-zinc-800 text-zinc-400"
        )}
      >
        {icon || <Check className="w-3 h-3" />}
      </div>
      <span className={highlightText ? "text-[#FFD700] font-bold" : ""}>
        {text}
      </span>
    </li>
  );
}

/* =========================================================
 * SHOP TABS
 * =======================================================*/
export function ShopTabs({
  childrenPacks,
  childrenSubs,
  childrenCosmetics,
}: {
  childrenPacks: React.ReactNode;
  childrenSubs: React.ReactNode;
  childrenCosmetics: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<
    "packs" | "subs" | "cosmetics"
  >("packs");

  const packsRef = useRef<HTMLButtonElement>(null);
  const subsRef = useRef<HTMLButtonElement>(null);
  const cosmeticsRef = useRef<HTMLButtonElement>(null);

  const [sliderStyle, setSliderStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    const ref =
      activeTab === "packs"
        ? packsRef
        : activeTab === "subs"
        ? subsRef
        : cosmeticsRef;

    if (!ref.current) return;

    setSliderStyle({
      left: ref.current.offsetLeft,
      width: ref.current.offsetWidth,
      opacity: 1,
    });
  }, [activeTab]);

  return (
    <div className="space-y-12">
      <div className="flex justify-center">
        <div className="relative inline-flex items-center bg-[#111] border border-[#27272a] h-14 p-1 rounded-full">
          <motion.div
            className="absolute h-[calc(100%-0.5rem)] bg-[#FFD700] rounded-full z-0"
            animate={sliderStyle}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />

          <TabButton
            ref={packsRef}
            active={activeTab === "packs"}
            onClick={() => setActiveTab("packs")}
            icon={<Coins className="w-4 h-4" />}
            label="Pacotes"
          />
          <TabButton
            ref={subsRef}
            active={activeTab === "subs"}
            onClick={() => setActiveTab("subs")}
            icon={<Crown className="w-4 h-4" />}
            label="Assinaturas"
          />
          <TabButton
            ref={cosmeticsRef}
            active={activeTab === "cosmetics"}
            onClick={() => setActiveTab("cosmetics")}
            icon={<Gem className="w-4 h-4" />}
            label="Cosméticos"
          />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "packs" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
            {childrenPacks}
          </div>
        )}
        {activeTab === "subs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {childrenSubs}
          </div>
        )}
        {activeTab === "cosmetics" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {childrenCosmetics}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
 * TAB BUTTON
 * =======================================================*/
const TabButton = forwardRef<
  HTMLButtonElement,
  {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
  }
>(function TabButton({ active, onClick, icon, label }, ref) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "relative z-10 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors",
        active ? "text-black" : "text-zinc-400 hover:text-white"
      )}
    >
      {icon} {label}
    </button>
  );
});
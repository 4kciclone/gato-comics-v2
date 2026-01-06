"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  type ReactNode,
} from "react";
import {
  Check,
  Gem,
  Zap,
  Sparkles,
  Crown,
  Coins,
  Star,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { useFormStatus } from "react-dom";

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
  icon: "bronze" | "silver" | "gold" | "diamond" | "legendary";
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
  icon,
  popular,
  legendary,
  packId,
  action,
}: PackCardProps) {
  let iconColor = "text-zinc-400";
  let glowColor = "group-hover:shadow-zinc-500/20";
  let borderColor = "border-zinc-800";
  let bgGradient = "from-[#111] to-[#0a0a0a]";

  if (icon === "bronze") iconColor = "text-orange-700";
  if (icon === "silver") iconColor = "text-zinc-300";
  if (icon === "gold") {
    iconColor = "text-yellow-400";
    glowColor = "group-hover:shadow-yellow-500/30";
    borderColor = "group-hover:border-yellow-500/50";
  }
  if (icon === "diamond") {
    iconColor = "text-cyan-400";
    glowColor = "group-hover:shadow-cyan-500/30";
  }
  if (legendary || icon === "legendary") {
    iconColor = "text-purple-400";
    glowColor = "shadow-purple-500/30 group-hover:shadow-purple-500/50";
    borderColor = "border-purple-500";
    bgGradient = "from-[#1a0b2e] to-[#0a0a0a]";
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
          <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
            Best Seller
          </div>
        )}

        {legendary && (
          <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
            Lendário
          </div>
        )}

        <div className="flex justify-center mb-6 mt-2">
          <div
            className={cn(
              "p-4 rounded-full bg-white/5 ring-1 ring-white/10 relative",
              iconColor
            )}
          >
            <Gem className="w-8 h-8" />
            <div className={cn("absolute inset-0 blur-xl opacity-40", iconColor)} />
          </div>
        </div>

        <div className="text-center space-y-1 mb-8">
          <h3 className="text-zinc-400 uppercase tracking-widest text-xs">
            {label}
          </h3>
          <div className="text-4xl font-black text-white flex justify-center gap-2">
            {premium} <Coins className="w-6 h-6 text-[#FFD700]" />
          </div>

          {lite > 0 && (
            <div className="inline-flex items-center gap-1 bg-green-900/30 text-green-400 px-2 py-0.5 rounded text-xs font-bold border border-green-900/50">
              <Sparkles className="w-3 h-3" /> +{lite} Bônus Lite
            </div>
          )}
        </div>

        <form action={action} className="mt-auto">
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
  icon?: "zap" | "sparkles" | "crown" | "diamond";
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
  icon,
  recommended,
  subId,
  action,
}: SubCardProps) {
  let Icon = Zap;
  let iconColor = "text-orange-500";

  if (icon === "sparkles") {
    Icon = Sparkles;
    iconColor = "text-zinc-300";
  }
  if (icon === "crown") {
    Icon = Crown;
    iconColor = "text-yellow-400";
  }
  if (icon === "diamond") {
    Icon = Gem;
    iconColor = "text-cyan-400";
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl transition-all duration-300",
        recommended
          ? "border-2 border-[#FFD700] bg-[#0f0f0f] scale-105 z-10 shadow-[0_0_40px_rgba(255,215,0,0.15)]"
          : "border border-zinc-800 bg-[#0a0a0a] hover:border-zinc-600"
      )}
    >
      {recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
          <Crown className="w-3 h-3" /> Recomendado
        </div>
      )}

      <div className="p-8 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6 pt-2">
          <div className={cn("p-3 rounded-lg bg-zinc-900", iconColor)}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">
            {label}
          </h3>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-zinc-500 text-lg">R$</span>
            <span className="text-5xl font-black text-white">
              {Math.floor(price / 100)}
            </span>
            <span className="text-zinc-500">
              ,{(price % 100).toString().padStart(2, "0")}
            </span>
            <span className="text-zinc-500 ml-1">/mês</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Cancele quando quiser.
          </p>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
          <ListItem text="Sem anúncios" highlighted />
          <ListItem text={`${works} obras à escolha`} />
          <ListItem
            text={`${monthlyPaws} Patinhas Lite mensais`}
            highlightText
          />
          <ListItem text={`${discount}% de desconto na loja`} />
        </ul>

        <form action={action}>
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
  text: string;
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


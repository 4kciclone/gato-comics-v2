"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input"; // Importe o Input
import { Gift, PlayCircle, Loader2, CheckCircle, Coins } from "lucide-react";
import { claimDailyReward, watchAdReward, getRewardStatus, redeemCode } from "@/actions/rewards"; // Importe redeemCode
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CurrencyIcon } from "@/components/ui/currency-icon";

const MAX_ADS_PER_DAY = 5;

export function RewardModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<'daily' | 'ad' | 'status' | false>(false);
  const [adTimer, setAdTimer] = useState(0);

  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);

  // --- ESTADOS PARA O CÓDIGO DE PRESENTE ---
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const fetchStatus = async () => {
    setIsLoading('status');
    const status = await getRewardStatus();
    if (!status.error) {
      setDailyClaimed(status.dailyClaimed);
      setAdsWatched(status.adsWatched);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleDaily = async () => {
    setIsLoading('daily');
    const res = await claimDailyReward();
    setIsLoading(false);
    if (res.error) {
      toast.error("Ops!", { description: res.error });
      setDailyClaimed(true);
    } else {
      toast.success("Check-in Realizado!", { description: `Você ganhou +${res.amount} Patinha Lite.` });
      setDailyClaimed(true);
    }
  };

  const handleWatchAd = () => {
    setIsLoading('ad');
    setAdTimer(5);
    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishAd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishAd = async () => {
    const res = await watchAdReward();
    setIsLoading(false);
    if (res.error) {
      toast.error("Limite Atingido", { description: res.error });
      setAdsWatched(MAX_ADS_PER_DAY);
    } else {
      toast.success("Recompensa Recebida!", { description: `+${res.amount} Patinha Lite!` });
      setAdsWatched(prev => prev + 1);
    }
  };

  // --- FUNÇÃO DE RESGATE ---
  const handleRedeem = async () => {
    if (!code) return;
    setIsRedeeming(true);
    const res = await redeemCode(code);
    setIsRedeeming(false);
    
    if (res.error) {
        toast.error("Erro", { description: res.error });
    } else {
        toast.success("Resgatado!", { description: `Você ganhou +${res.amount} Patinhas ${res.type}!` });
        setCode("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-[#FFD700] hover:bg-[#FFD700]/10">
           <Gift className="w-6 h-6 animate-pulse" />
           <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111111] border-[#27272a] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-[#FFD700]" /> Missões Diárias
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          
          {/* Card do Check-in Diário */}
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#27272a] flex items-center justify-between transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-green-900/20 rounded-full text-green-500"><CheckCircle className="w-6 h-6" /></div>
               <div>
                 <h3 className="font-bold text-white">Check-in Diário</h3>
                 <p className="text-xs text-zinc-400">Resgate uma vez por dia</p>
               </div>
             </div>
             <Button 
               onClick={handleDaily} 
               disabled={isLoading !== false || dailyClaimed}
               className={cn(
                 "min-w-32 rounded-lg font-bold transition-all",
                 dailyClaimed 
                   ? "bg-green-900/50 text-green-400 border border-green-800 cursor-not-allowed"
                   : "bg-[#FFD700] text-black hover:bg-yellow-300"
               )}
             >
               {isLoading === 'daily' ? <Loader2 className="animate-spin w-5 h-5"/> : 
                dailyClaimed ? <><CheckCircle className="w-5 h-5 mr-2"/> Resgatado</> : "Resgatar +1"} 
             </Button>
          </div>

          {/* Card de Assistir Anúncio */}
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#27272a] flex items-center justify-between transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-blue-900/20 rounded-full text-blue-500"><PlayCircle className="w-6 h-6" /></div>
               <div>
                 <h3 className="font-bold text-white">Assistir Anúncio</h3>
                 <p className="text-xs text-zinc-400">Recompensas hoje: {adsWatched}/{MAX_ADS_PER_DAY}</p>
               </div>
             </div>
             
             {adTimer > 0 ? (
               <div className="w-28 text-center">
                 <p className="text-xs text-zinc-400 mb-1">Aguarde...</p>
                 <Progress value={(5 - adTimer) * 20} className="h-2 bg-zinc-800" />
               </div>
             ) : (
               <Button 
                onClick={handleWatchAd} 
                disabled={isLoading !== false || adsWatched >= MAX_ADS_PER_DAY}
                variant="outline"
                className="min-w-[100px] h-10 px-4 rounded-lg font-bold border-2 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                {isLoading === 'ad' ? (
                    <Loader2 className="animate-spin w-5 h-5"/>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                    <span className="text-base pt-0.5">+1</span>
                    <CurrencyIcon type="lite" size={11} /> 
                    </div>
                )}
               </Button>
             )}
          </div>

          {/* ÁREA DE CÓDIGO DE PRESENTE (NOVO) */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Código de Presente</label>
            <div className="flex gap-2">
                <Input 
                    placeholder="Digite seu código..." 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 font-mono uppercase"
                />
                <Button 
                    onClick={handleRedeem}
                    disabled={isRedeeming || !code}
                    className="bg-zinc-800 text-white hover:bg-zinc-700 min-w-25"
                >
                    {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin"/> : "Resgatar"}
                </Button>
            </div>
          </div>
          
          <div className="bg-[#FFD700]/5 border border-[#FFD700]/10 p-3 rounded text-center text-xs text-[#FFD700] font-medium">
             💡 Patinhas Lite ganhas aqui expiram em <strong>7 dias</strong>. O aluguel de capítulo dura 72 horas.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
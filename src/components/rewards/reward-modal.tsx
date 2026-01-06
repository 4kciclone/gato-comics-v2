"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Gift, PlayCircle, Loader2, CheckCircle, Coins } from "lucide-react";
import { claimDailyReward, watchAdReward, getRewardStatus } from "@/actions/rewards";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_ADS_PER_DAY = 5;

export function RewardModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adTimer, setAdTimer] = useState(0);

  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [adsWatched, setAdsWatched] = useState(0);

  const fetchStatus = async () => {
    setIsLoading(true);
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
    setIsLoading(true);
    const res = await claimDailyReward();
    setIsLoading(false);
    if (res.error) {
      toast.error("Ops!", { description: res.error });
      setDailyClaimed(true);
    } else {
      toast.success("Check-in Realizado!", { description: `Você ganhou +${res.amount} Patinhas Lite.` });
      setDailyClaimed(true);
    }
  };

  const handleWatchAd = () => {
    setIsLoading(true);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-[#FFD700] hover:bg-[#FFD700]/10">
           <Gift className="w-6 h-6 animate-pulse" />
           <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111] border-[#27272a] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-[#FFD700]" /> Missões Diárias
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#27272a] flex items-center justify-between hover:border-[#FFD700]/30 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-green-900/20 rounded-full text-green-500"><CheckCircle className="w-6 h-6" /></div>
               <div>
                 <h3 className="font-bold text-white">Check-in Diário</h3>
                 <p className="text-xs text-zinc-400">Resgate uma vez por dia</p>
               </div>
             </div>
             <Button onClick={handleDaily} disabled={isLoading || dailyClaimed} className={cn("min-w-25", dailyClaimed && "bg-green-800 hover:bg-green-800")}>
               {isLoading ? <Loader2 className="animate-spin w-4 h-4"/> : dailyClaimed ? <><CheckCircle className="w-4 h-4 mr-2"/> Resgatado</> : "Resgatar +5"}
             </Button>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#27272a] flex items-center justify-between hover:border-blue-500/30 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-blue-900/20 rounded-full text-blue-500"><PlayCircle className="w-6 h-6" /></div>
               <div>
                 <h3 className="font-bold text-white">Assistir Anúncio</h3>
                 <p className="text-xs text-zinc-400">Recompensas hoje: {adsWatched}/{MAX_ADS_PER_DAY}</p>
               </div>
             </div>
             {adTimer > 0 ? (
               <div className="w-25 text-center"><Progress value={(5 - adTimer) * 20} className="h-2" /></div>
             ) : (
               <Button onClick={handleWatchAd} disabled={isLoading || adsWatched >= MAX_ADS_PER_DAY} variant="outline" className="min-w-25 border-zinc-700 hover:bg-zinc-800 text-white">
                 <span className="mr-2">+1</span> <Coins className="w-3 h-3 text-zinc-400" />
               </Button>
             )}
          </div>
          <div className="bg-[#FFD700]/5 border border-[#FFD700]/10 p-3 rounded text-center text-xs text-[#FFD700] font-medium">
             💡 Patinhas Lite ganhas aqui expiram em <strong>7 dias</strong>. O aluguel de capítulo dura 72 horas.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
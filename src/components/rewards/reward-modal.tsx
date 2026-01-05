"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, PlayCircle, Loader2, CheckCircle, Coins } from "lucide-react";
import { claimDailyReward, watchAdReward } from "@/actions/rewards";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner"; 

export function RewardModal() {
  const [loading, setLoading] = useState(false);
  const [adTimer, setAdTimer] = useState(0); 
  const [open, setOpen] = useState(false);

  // Handler: Check-in
  const handleDaily = async () => {
    setLoading(true);
    const res = await claimDailyReward();
    setLoading(false);

    if (res.error) {
      toast.error("Ops!", { description: res.error });
    } else {
      setOpen(false);
      // Som de sucesso visual
      toast.success("Check-in Realizado!", { 
        description: `Você ganhou +${res.amount} Patinhas Lite.` 
      });
    }
  };

  // Handler: Assistir Ad
  const handleWatchAd = () => {
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
    setLoading(true);
    const res = await watchAdReward();
    setLoading(false);
    
    if (res.error) {
      toast.error("Limite Atingido", { description: res.error });
    } else {
      toast.success("Recompensa Recebida!", { 
        description: `+${res.amount} Patinha! Restam ${res.remaining} hoje.` 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-[#FFD700] hover:bg-[#FFD700]/10">
           <Gift className="w-6 h-6 animate-pulse" />
           <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111111] border-[#27272a] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-[#FFD700]" />
            Missões Diárias
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* CARD 1: CHECK-IN */}
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#27272a] flex items-center justify-between hover:border-[#FFD700]/30 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-green-900/20 rounded-full text-green-500">
                 <CheckCircle className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="font-bold text-white">Check-in Diário</h3>
                 <p className="text-xs text-zinc-400">Resgate suas patinhas grátis</p>
               </div>
             </div>
             
             <Button 
               onClick={handleDaily} 
               disabled={loading}
               // Tailwind v4 fix: min-w-25 (100px)
               className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90 min-w-25"
             >
               {loading ? <Loader2 className="animate-spin w-4 h-4"/> : "Resgatar +5"}
             </Button>
          </div>

          {/* CARD 2: ASSISTIR AD */}
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#27272a] flex items-center justify-between hover:border-blue-500/30 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-blue-900/20 rounded-full text-blue-500">
                 <PlayCircle className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="font-bold text-white">Assistir Anúncio</h3>
                 <p className="text-xs text-zinc-400">Apoie a plataforma</p>
               </div>
             </div>
             
             {adTimer > 0 ? (
               // Tailwind v4 fix: w-25 (100px)
               <div className="w-25 text-center">
                 <span className="text-xs text-zinc-400 mb-1 block">Aguarde...</span>
                 <Progress value={(5 - adTimer) * 20} className="h-2 bg-zinc-800" />
               </div>
             ) : (
               <Button 
                 onClick={handleWatchAd} 
                 disabled={loading}
                 variant="outline"
                 // Tailwind v4 fix: min-w-25 (100px)
                 className="border-zinc-700 hover:bg-zinc-800 text-white min-w-25"
               >
                 <span className="mr-2">+1</span> <Coins className="w-3 h-3 text-zinc-400" />
               </Button>
             )}
          </div>

          <div className="bg-[#FFD700]/5 border border-[#FFD700]/10 p-3 rounded text-center text-xs text-[#FFD700] font-medium">
             💡 Patinhas ganhas aqui expiram em 72 horas.
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
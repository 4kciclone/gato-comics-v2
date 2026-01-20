"use client";

import { useState, useTransition } from "react";
import { cancelSubscription, resumeSubscription } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CancelButtonProps {
  isCanceled: boolean; // Se já está agendado para cancelar
}

export function CancelSubscriptionButton({ isCanceled }: CancelButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const res = await cancelSubscription();
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Assinatura cancelada com sucesso.");
        setIsOpen(false);
      }
    });
  };

  const handleResume = () => {
    startTransition(async () => {
      const res = await resumeSubscription();
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Assinatura renovada!");
      }
    });
  };

  // Se já estiver cancelada (mas ainda ativa pelo período pago), mostra botão de reativar
  if (isCanceled) {
    return (
      <div className="space-y-2">
         <p className="text-sm text-yellow-500 font-medium">
           ⚠️ Seu plano não será renovado.
         </p>
         <Button 
            onClick={handleResume} 
            disabled={isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
         >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
            Reativar Renovação Automática
         </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-red-900/30 text-red-400 hover:bg-red-900/10 hover:text-red-300">
          Cancelar Assinatura
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" /> Cancelar Assinatura?
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Ao cancelar, você <strong>manterá seus benefícios</strong> até o fim do ciclo de cobrança atual. Após isso, você perderá acesso às obras extras e patinhas mensais.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Manter Plano
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel} 
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
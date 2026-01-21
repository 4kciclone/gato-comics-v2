"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "@/actions/settings"; // Certifique-se que essa action existe
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteFormProps {
    username: string; // Precisamos receber o username para comparar
}

export function DeleteAccountForm({ username }: DeleteFormProps) {
  const [state, formAction, isPending] = useActionState(deleteAccount, null);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText === username;

  // Se houver erro na exclusão, mostra toast
  if (state?.error) {
      toast.error(state.error);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 font-bold">
            <Trash2 className="w-4 h-4 mr-2" /> Excluir Conta
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-[#111] border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
             <AlertTriangle className="w-5 h-5" /> Tem certeza absoluta?
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="confirm" className="text-zinc-300">
                    Digite <span className="font-mono font-bold text-white select-all">{username}</span> para confirmar.
                </Label>
                <Input 
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="bg-zinc-950 border-zinc-700 text-white focus:border-red-500 transition-colors"
                    placeholder="Digite seu username"
                    autoComplete="off"
                />
            </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
            Cancelar
          </Button>
          
          <form action={formAction}>
             <Button 
                variant="destructive" 
                className="w-full bg-red-600 hover:bg-red-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isConfirmed || isPending}
             >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Confirmar Exclusão"}
             </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
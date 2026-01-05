"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react"; // <-- CORREÇÃO DA IMPORTAÇÃO
import { toast } from "sonner";
import { createReport } from "@/actions/moderation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger, // <-- Garante que o DialogTrigger está importado
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MoreHorizontal, ShieldAlert, Loader2 } from "lucide-react";

interface ReportButtonProps {
  commentId: string;
}

const reportReasons = [
  { id: "SPOILER", label: "Spoiler sem marcação" },
  { id: "HATE_SPEECH", label: "Discurso de ódio ou assédio" },
  { id: "SPAM", label: "Spam ou publicidade" },
  { id: "OTHER", label: "Outro motivo" },
];

export function ReportButton({ commentId }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createReport, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Denúncia Enviada", { description: state.success });
      setIsOpen(false);
    }
    if (state?.error) {
      toast.error("Erro", { description: state.error });
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-white">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#111] border-[#27272a] text-white">
          {/* Este DialogTrigger abre o Dialog que está fora do DropdownMenu */}
          <DialogTrigger asChild>
            <DropdownMenuItem className="cursor-pointer text-yellow-500 focus:bg-yellow-900/50 focus:text-yellow-400">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Denunciar
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="bg-[#111] border-[#27272a] text-white">
        <DialogHeader>
          <DialogTitle>Denunciar Comentário</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Ajude a manter a comunidade segura. Selecione o motivo da denúncia.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-6 py-4">
          <input type="hidden" name="commentId" value={commentId} />
          
          <RadioGroup name="reason" required className="space-y-2">
            {reportReasons.map(reason => (
              <div key={reason.id} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.id} id={reason.id} className="border-zinc-600 text-[#FFD700]" />
                <Label htmlFor={reason.id}>{reason.label}</Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="notes">Detalhes (Opcional)</Label>
            <Textarea 
              id="notes" 
              name="notes"
              placeholder="Forneça mais detalhes sobre o motivo da denúncia..."
              className="bg-[#0a0a0a] border-[#27272a]"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isPending} className="bg-[#FFD700] text-black">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Denúncia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
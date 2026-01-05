"use client";

import { useActionState } from "react"; // <-- CORREÇÃO DA IMPORTAÇÃO
import { resolveReport } from "@/actions/moderation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Check, Gavel, Loader2 } from "lucide-react";
import { useEffect } from "react";

export function ModerationActions({ reportId }: { reportId: string }) {
  const [state, formAction, isPending] = useActionState(resolveReport, null);

  // Usamos useEffect para mostrar o toast apenas quando o estado muda
  useEffect(() => {
    if (state?.success) toast.success("Ação de Moderação Concluída!");
    if (state?.error) toast.error("Erro", { description: state.error });
  }, [state]);

  return (
    <div className="flex gap-2">
      <form action={formAction}>
        <input type="hidden" name="reportId" value={reportId} />
        <input type="hidden" name="action" value="DISMISS" />
        <Button 
          type="submit" 
          variant="outline" 
          size="sm" 
          disabled={isPending}
          className="bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/50 hover:text-green-300"
        >
          <Check className="w-4 h-4 mr-2" /> Ignorar
        </Button>
      </form>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Gavel className="w-4 h-4 mr-2" /> Punir
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#111] border-[#27272a] text-white">
          <DialogHeader>
            <DialogTitle>Aplicar Punição</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4 py-4">
            <input type="hidden" name="reportId" value={reportId} />
            <input type="hidden" name="action" value="PUNISH" />
            <Select name="punishmentType" defaultValue="DELETE_COMMENT" required>
              <SelectTrigger className="bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DELETE_COMMENT">Apenas Deletar Comentário</SelectItem>
                <SelectItem value="MUTE_24H">Deletar e Silenciar por 24h</SelectItem>
                <SelectItem value="MUTE_7D">Deletar e Silenciar por 7 dias</SelectItem>
                <SelectItem value="BAN">Deletar e Banir Permanentemente</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} variant="destructive">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Aplicar Punição
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleWorkVisibility } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface VisibilityToggleButtonProps {
  workId: string;
  initialIsHidden: boolean;
}

export function VisibilityToggleButton({ workId, initialIsHidden }: VisibilityToggleButtonProps) {
  const [isHidden, setIsHidden] = useState(initialIsHidden);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      // UI Otimista: muda o estado visualmente antes da resposta do servidor
      setIsHidden(!isHidden); 

      const result = await toggleWorkVisibility(workId, isHidden);
      
      if (result?.error) {
        toast.error("Erro", { description: result.error });
        setIsHidden(isHidden); // Reverte o estado em caso de erro
      } else {
        toast.success(isHidden ? "Obra publicada com sucesso!" : "Obra ocultada.");
      }
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={isHidden ? "secondary" : "default"}
      className={isHidden ? "bg-zinc-800 text-zinc-300" : "bg-green-700 hover:bg-green-600"}
    >
      {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
        isHidden ? <><Eye className="w-4 h-4 mr-2" /> Publicar Obra</> : 
                     <><EyeOff className="w-4 h-4 mr-2" /> Ocultar Obra</>
      }
    </Button>
  );
}
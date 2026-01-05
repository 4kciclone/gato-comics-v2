"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SubmitButtonProps {
  price: number;
}

export function SubmitButton({ price }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button 
      disabled={pending}
      className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90 h-12 text-lg transition-transform active:scale-95"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        `Comprar por ${formatCurrency(price)}`
      )}
    </Button>
  );
}
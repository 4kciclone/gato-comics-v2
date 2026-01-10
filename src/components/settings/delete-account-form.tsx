"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function DeleteAccountForm() {
  // O hook useActionState gerencia o retorno da action e o estado de carregamento
  const [state, action, isPending] = useActionState(deleteAccount, null);

  return (
    <form action={action}>
      {state?.error && (
        <p className="text-red-400 text-sm mb-2">{state.error}</p>
      )}
      
      <Button 
        variant="destructive" 
        type="submit" 
        className="bg-red-600 hover:bg-red-700 w-full md:w-auto"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Excluindo...
          </>
        ) : (
          "Confirmar Exclusão"
        )}
      </Button>
    </form>
  );
}
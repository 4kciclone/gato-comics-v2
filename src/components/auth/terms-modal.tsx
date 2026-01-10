"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEGAL_TEXTS } from "@/lib/legal-text";
import { ShieldCheck } from "lucide-react";

interface TermsModalProps {
  onAccept: () => void;
}

export function TermsModal({ onAccept }: TermsModalProps) {
  const [open, setOpen] = useState(false);

  const handleAccept = () => {
    onAccept();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-[#FFD700] hover:underline font-medium ml-1">
          Termos de Uso e Privacidade
        </button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl bg-[#111111] border-[#27272a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#FFD700]">
            <ShieldCheck className="w-5 h-5" />
            Termos e Políticas do Gato Comics
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Por favor, leia atentamente. Ao aceitar, enviaremos uma cópia para seu email.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#050505]">
            <TabsTrigger value="terms">Termos de Uso</TabsTrigger>
            <TabsTrigger value="privacy">Privacidade (LGPD)</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 border border-[#27272a] rounded-md p-4 bg-[#050505]">
            <ScrollArea className="h-[300px] w-full rounded-md pr-4">
              <TabsContent value="terms" className="mt-0">
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {LEGAL_TEXTS.terms}
                </div>
              </TabsContent>
              <TabsContent value="privacy" className="mt-0">
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {LEGAL_TEXTS.privacy}
                </div>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 flex sm:justify-between items-center gap-4">
          <p className="text-xs text-zinc-500 hidden sm:block">
            Última atualização: Janeiro/2026
          </p>
          <Button 
            onClick={handleAccept} 
            className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90 w-full sm:w-auto"
          >
            Li, Entendi e Concordo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
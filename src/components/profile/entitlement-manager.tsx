"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react"; // CORREÇÃO: Importado de 'react'
import { manageWorkEntitlement } from "@/actions/subscription";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"; // A importação agora funcionará
import { Plus, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Work { id: string; title: string; coverUrl: string; }
interface Entitlement { id: string; workId: string; work: Work; }

interface EntitlementManagerProps {
  entitledWorks: Entitlement[];
  allWorks: Work[];
  maxSlots: number;
  canChange: boolean;
}

export function EntitlementManager({ entitledWorks, allWorks, maxSlots, canChange }: EntitlementManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [state, formAction, isPending] = useActionState(manageWorkEntitlement, null);

  useEffect(() => {
    if (state?.success) { 
      toast.success("Sucesso!", { description: state.success }); 
      setIsModalOpen(false); // Fecha o modal ao adicionar/remover com sucesso
      setSearch(""); // Limpa a busca
    }
    if (state?.error) { 
      toast.error("Erro", { description: state.error }); 
    }
  }, [state]);

  const occupiedSlots = entitledWorks.length;
  const emptySlots = maxSlots - occupiedSlots;
  const entitledWorkIds = new Set(entitledWorks.map(e => e.workId));

  const filteredWorks = allWorks.filter(work => 
    work.title.toLowerCase().includes(search.toLowerCase()) && !entitledWorkIds.has(work.id)
  );

  return (
    <div className="space-y-4">
        <p className="text-sm text-zinc-500 font-medium">Slots Ocupados: {occupiedSlots} / {maxSlots}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            
            {/* Slots Ocupados */}
            {entitledWorks.map(entitlement => (
                <Card key={entitlement.id} className="relative group overflow-hidden border-2 border-zinc-700">
                    <img src={entitlement.work.coverUrl} alt={entitlement.work.title} className="w-full h-full object-cover aspect-2/3" />
                    {/* Tailwind v4 fix: bg-linear-to-t */}
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent p-2 flex flex-col justify-end">
                        <h4 className="font-bold text-white text-xs truncate">{entitlement.work.title}</h4>
                    </div>
                    {canChange && (
                        <form action={formAction}>
                            <input type="hidden" name="workId" value={entitlement.workId} />
                            <input type="hidden" name="action" value="REMOVE" />
                            <Button type="submit" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-4 h-4" />
                            </Button>
                        </form>
                    )}
                </Card>
            ))}

            {/* Slots Vazios */}
            {occupiedSlots < maxSlots && Array.from({ length: emptySlots }).map((_, index) => (
                <DialogTrigger key={index} asChild>
                    <Card 
                        onClick={() => setIsModalOpen(true)}
                        className="aspect-2/3 border-2 border-dashed border-zinc-700 bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700] hover:text-[#FFD700] text-zinc-600 transition-colors"
                    >
                        <Plus className="w-8 h-8 mb-2" />
                        <span className="text-xs font-bold">Adicionar Obra</span>
                    </Card>
                </DialogTrigger>
            ))}
        </div>
        
        {/* Modal de Seleção */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl h-[80vh] bg-[#111] border-[#27272a] text-white flex flex-col">
                <DialogHeader>
                    <DialogTitle>Selecione uma Obra para Vincular</DialogTitle>
                    <Input placeholder="Buscar obra..." value={search} onChange={(e) => setSearch(e.target.value)} className="mt-4 bg-zinc-900 border-zinc-700"/>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
                        {filteredWorks.map(work => (
                            <form action={formAction} key={work.id}>
                                <input type="hidden" name="workId" value={work.id} />
                                <input type="hidden" name="action" value="ADD" />
                                <button type="submit" disabled={isPending} className="w-full aspect-2/3 relative group overflow-hidden rounded-md block disabled:opacity-50 disabled:cursor-not-allowed">
                                    <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        {isPending ? <Loader2 className="animate-spin text-white"/> : <Check className="text-white w-8 h-8"/>}
                                    </div>
                                </button>
                            </form>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    </div>
  );
}
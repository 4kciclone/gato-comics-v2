"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react"; 
import { manageWorkEntitlement } from "@/actions/subscription";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Loader2, Check, Lock, AlertCircle } from "lucide-react"; // Ícone de cadeado fechado

interface Work { id: string; title: string; coverUrl: string; }
interface Entitlement { id: string; workId: string; work: Work; }

interface EntitlementManagerProps {
  entitledWorks: Entitlement[];
  allWorks: Work[];
  maxSlots: number;
}

export function EntitlementManager({ entitledWorks, allWorks, maxSlots }: EntitlementManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingWork, setPendingWork] = useState<Work | null>(null);
  const [state, formAction, isPending] = useActionState(manageWorkEntitlement, null);

  useEffect(() => {
    if (state?.success) { 
      toast.success("Sucesso!", { description: state.success }); 
      setIsModalOpen(false); 
      setPendingWork(null);
      setSearch("");
    }
    if (state?.error) { 
      toast.error("Erro", { description: state.error }); 
    }
  }, [state]);

  const occupiedSlots = entitledWorks.length;
  const emptySlots = Math.max(0, maxSlots - occupiedSlots);
  const entitledWorkIds = new Set(entitledWorks.map(e => e.workId));

  const filteredWorks = allWorks.filter(work => 
    work.title.toLowerCase().includes(search.toLowerCase()) && !entitledWorkIds.has(work.id)
  );

  return (
    <>
      <div className="space-y-6">
          <div className="flex justify-between text-sm text-zinc-500 font-medium">
             <span>Slots Utilizados: <span className="text-white">{occupiedSlots}</span> / {maxSlots}</span>
             <span className="text-zinc-600 text-xs">Reseta na renovação</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              
              {/* Obras Já Vinculadas (TRAVADAS) */}
              {entitledWorks.map(entitlement => (
                  <Card key={entitlement.id} className="relative group overflow-hidden border border-zinc-800 bg-zinc-900 aspect-[2/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entitlement.work.coverUrl} alt={entitlement.work.title} className="w-full h-full object-cover opacity-70" />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-3 flex flex-col justify-end">
                          <h4 className="font-bold text-white text-xs line-clamp-2">{entitlement.work.title}</h4>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1 uppercase font-bold">
                              <Lock className="w-3 h-3" /> Travado
                          </div>
                      </div>
                      {/* Não existe mais botão de remover aqui */}
                  </Card>
              ))}

              {/* Slots Vazios (Clicáveis) */}
              {emptySlots > 0 && Array.from({ length: emptySlots }).map((_, index) => (
                  <Card 
                      key={`empty-${index}`}
                      onClick={() => setIsModalOpen(true)}
                      className="aspect-[2/3] border-2 border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700] hover:text-[#FFD700] text-zinc-600 transition-all group"
                  >
                      <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mb-2 group-hover:bg-[#FFD700] group-hover:text-black transition-colors">
                          <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Escolher Obra</span>
                  </Card>
              ))}
          </div>

          <div className="bg-blue-950/20 border border-blue-900/30 p-3 rounded-lg flex gap-3 text-xs text-blue-400 items-start">
             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
             <p>Atenção: Ao confirmar uma obra, ela ocupará o slot permanentemente até o próximo ciclo de cobrança. Escolha com sabedoria!</p>
          </div>
      </div>
      
      {/* MODAL (Igual ao anterior, apenas a lógica de submit chama a action sem remove) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl h-[80vh] bg-[#111] border-[#27272a] text-white flex flex-col p-0 overflow-hidden">
              {!pendingWork ? (
                  <>
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Preencher Slot Vazio</DialogTitle>
                        <div className="relative mt-2">
                            <Input placeholder="Buscar título..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white focus:border-[#FFD700]"/>
                        </div>
                    </DialogHeader>
                    <ScrollArea className="flex-1 p-6 pt-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredWorks.map(work => (
                                <button key={work.id} onClick={() => setPendingWork(work)} className="w-full aspect-[2/3] relative group overflow-hidden rounded-md block border border-zinc-800 hover:border-[#FFD700] transition-colors text-left">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-xs font-bold text-white px-3 py-1 bg-[#FFD700] text-black rounded-full">Selecionar</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2"><p className="text-xs font-bold text-white truncate">{work.title}</p></div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                  </>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                      <div className="w-32 aspect-[2/3] rounded-lg overflow-hidden border-2 border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={pendingWork.coverUrl} alt={pendingWork.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-white mb-2">Travar slot com "{pendingWork.title}"?</h2>
                          <p className="text-zinc-400 max-w-md text-sm">
                              Esta ação não pode ser desfeita até a próxima renovação da assinatura.
                          </p>
                      </div>
                      <div className="flex gap-3 w-full max-w-sm">
                          <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300" onClick={() => setPendingWork(null)}>Voltar</Button>
                          <form action={formAction} className="flex-1">
                              <input type="hidden" name="workId" value={pendingWork.id} />
                              <input type="hidden" name="action" value="ADD" />
                              <Button type="submit" disabled={isPending} className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90">
                                  {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Confirmar e Travar"}
                              </Button>
                          </form>
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </>
  );
}
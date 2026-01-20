"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react"; 
import { manageWorkEntitlement } from "@/actions/subscription";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Loader2, Check } from "lucide-react";

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

  // Monitora o sucesso para fechar o modal
  useEffect(() => {
    if (state?.success) { 
      toast.success("Sucesso!", { description: state.success }); 
      setIsModalOpen(false); 
      setSearch("");
    }
    if (state?.error) { 
      toast.error("Erro", { description: state.error }); 
    }
  }, [state]);

  const occupiedSlots = entitledWorks.length;
  const emptySlots = Math.max(0, maxSlots - occupiedSlots);
  const entitledWorkIds = new Set(entitledWorks.map(e => e.workId));

  // Filtra obras: Pelo nome E que ainda não foram selecionadas
  const filteredWorks = allWorks.filter(work => 
    work.title.toLowerCase().includes(search.toLowerCase()) && !entitledWorkIds.has(work.id)
  );

  return (
    <>
      <div className="space-y-4">
          <div className="flex justify-between text-sm text-zinc-500 font-medium">
             <span>Slots Ocupados: <span className="text-white">{occupiedSlots}</span> / {maxSlots}</span>
             {!canChange && occupiedSlots > 0 && <span className="text-red-400 text-xs">Troca bloqueada até o próximo ciclo</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              
              {/* 1. Slots Ocupados (Obras Vinculadas) */}
              {entitledWorks.map(entitlement => (
                  <Card key={entitlement.id} className="relative group overflow-hidden border border-zinc-800 bg-zinc-900 aspect-[2/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entitlement.work.coverUrl} alt={entitlement.work.title} className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-3 flex flex-col justify-end">
                          <h4 className="font-bold text-white text-xs line-clamp-2">{entitlement.work.title}</h4>
                      </div>
                      
                      {/* Botão de Remover (Só aparece se puder trocar) */}
                      {canChange && (
                          <form action={formAction}>
                              <input type="hidden" name="workId" value={entitlement.workId} />
                              <input type="hidden" name="action" value="REMOVE" />
                              <button type="submit" disabled={isPending} className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                                  {isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <X className="w-3 h-3" />}
                              </button>
                          </form>
                      )}
                  </Card>
              ))}

              {/* 2. Slots Vazios (Botões de Adicionar) */}
              {/* Só renderiza se a janela de troca estiver aberta */}
              {canChange && Array.from({ length: emptySlots }).map((_, index) => (
                  <Card 
                      key={`empty-${index}`}
                      onClick={() => setIsModalOpen(true)}
                      className="aspect-[2/3] border-2 border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700] hover:text-[#FFD700] text-zinc-600 transition-all group"
                  >
                      <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mb-2 group-hover:bg-[#FFD700] group-hover:text-black transition-colors">
                          <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Selecionar</span>
                  </Card>
              ))}

              {/* Slots Bloqueados (Se a janela fechou e tem espaço sobrando) */}
              {!canChange && emptySlots > 0 && Array.from({ length: emptySlots }).map((_, index) => (
                  <Card key={`locked-${index}`} className="aspect-[2/3] border border-zinc-900 bg-zinc-950 flex items-center justify-center opacity-50">
                      <span className="text-xs text-zinc-700">Vazio</span>
                  </Card>
              ))}
          </div>
      </div>
      
      {/* MODAL DE SELEÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl h-[80vh] bg-[#111] border-[#27272a] text-white flex flex-col p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-2">
                  <DialogTitle>Escolha uma obra para vincular</DialogTitle>
                  <div className="relative mt-2">
                    <Input 
                        placeholder="Buscar pelo título..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="bg-zinc-950 border-zinc-800 text-white focus:border-[#FFD700]"
                    />
                  </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 p-6 pt-2">
                  {filteredWorks.length === 0 ? (
                      <p className="text-center text-zinc-500 py-10">Nenhuma obra encontrada.</p>
                  ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {filteredWorks.map(work => (
                              <form action={formAction} key={work.id}>
                                  <input type="hidden" name="workId" value={work.id} />
                                  <input type="hidden" name="action" value="ADD" />
                                  
                                  <button 
                                    type="submit" 
                                    disabled={isPending} 
                                    className="w-full aspect-[2/3] relative group overflow-hidden rounded-md block border border-zinc-800 hover:border-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                  >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                      
                                      {/* Hover Overlay */}
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                                          {isPending ? <Loader2 className="animate-spin text-white mb-2"/> : <Check className="text-[#FFD700] w-8 h-8 mb-2"/>}
                                          <span className="text-xs font-bold text-white">Clique para vincular</span>
                                      </div>
                                      
                                      {/* Title Gradient */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2">
                                          <p className="text-xs font-bold text-white truncate">{work.title}</p>
                                      </div>
                                  </button>
                              </form>
                          ))}
                      </div>
                  )}
              </ScrollArea>
          </DialogContent>
      </Dialog>
    </>
  );
}
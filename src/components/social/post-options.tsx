"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { deletePost, editPost } from "@/actions/social";
import { createReport } from "@/actions/moderation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Trash2, Edit, Loader2, ShieldAlert } from "lucide-react";

interface PostOptionsProps {
  postId: string;
  postContent: string;
  isOwner: boolean;
}

const reportReasons = [
  { id: "HATE_SPEECH", label: "Discurso de ódio ou assédio" },
  { id: "SPAM", label: "Spam ou publicidade" },
  { id: "OTHER", label: "Outro motivo" },
];

export function PostOptions({ postId, postContent, isOwner }: PostOptionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(postContent);
  const [isEditing, setIsEditing] = useState(false);

  const [reportState, reportAction, isReportPending] = useActionState(createReport, null);

  useEffect(() => {
    if (reportState?.success) { toast.success(reportState.success); setIsReportOpen(false); }
    if (reportState?.error) { toast.error(reportState.error); }
  }, [reportState]);

  const handleDelete = async () => {
    const result = await deletePost(postId);
    if (result?.success) toast.success("Post deletado com sucesso.");
    else toast.error(result?.error || "Falha ao deletar.");
  };
  
  const handleEdit = async () => {
    setIsEditing(true);
    const result = await editPost(postId, editedContent);
    setIsEditing(false);
    if (result?.success) {
      toast.success("Post editado com sucesso.");
      setIsEditOpen(false);
    } else {
      toast.error(result?.error || "Falha ao editar.");
    }
  };

  return (
    <AlertDialog>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-white">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#111] border-[#27272a] text-white">
            {isOwner ? (
              <>
                <DialogTrigger asChild><DropdownMenuItem className="cursor-pointer focus:bg-[#27272a]"><Edit className="w-4 h-4 mr-2"/>Editar</DropdownMenuItem></DialogTrigger>
                <AlertDialogTrigger asChild><DropdownMenuItem className="cursor-pointer text-red-500 focus:bg-red-900/50 focus:text-red-400"><Trash2 className="w-4 h-4 mr-2"/>Excluir</DropdownMenuItem></AlertDialogTrigger>
              </>
            ) : (
              <DropdownMenuItem onSelect={() => setIsReportOpen(true)} className="cursor-pointer text-yellow-500 focus:bg-yellow-900/50 focus:text-yellow-400">
                <ShieldAlert className="w-4 h-4 mr-2" /> Denunciar Post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="bg-[#111] border-[#27272a] text-white">
          <DialogHeader><DialogTitle>Editar Post</DialogTitle></DialogHeader>
          <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="bg-[#0a0a0a] border-[#27272a]" rows={5}/>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing && <Loader2 className="w-4 h-4 animate-spin mr-2"/>} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialogContent className="bg-[#111] border-[#27272a] text-white">
        <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogDescription className="text-zinc-400">Esta ação não pode ser desfeita. Tem certeza que deseja excluir este post permanentemente?</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="bg-[#111] border-[#27272a] text-white">
          <DialogHeader><DialogTitle>Denunciar Post</DialogTitle><DialogDescription className="text-zinc-400">Selecione o motivo da denúncia.</DialogDescription></DialogHeader>
          <form action={reportAction} className="space-y-6 py-4">
            <input type="hidden" name="postId" value={postId} />
            <RadioGroup name="reason" required className="space-y-2">
              {reportReasons.map(r => <div key={r.id} className="flex items-center space-x-2"><RadioGroupItem value={r.id} id={`post-${r.id}`} /><Label htmlFor={`post-${r.id}`}>{r.label}</Label></div>)}
            </RadioGroup>
            <Textarea name="notes" placeholder="Detalhes adicionais (opcional)..." className="bg-[#0a0a0a] border-[#27272a]"/>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isReportPending} className="bg-[#FFD700] text-black">
                {isReportPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Enviar Denúncia
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AlertDialog>
  );
}
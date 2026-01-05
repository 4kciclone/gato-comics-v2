"use client";

import { useEffect, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createComment } from "@/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface CommentFormProps {
  workId?: string;
  chapterId?: string;
  parentId?: string;
  postId?: string; // Prop para o contexto do Post Social
  onSuccess?: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="icon" className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black shrink-0">
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
    </Button>
  );
}

export function CommentForm({ workId, chapterId, parentId, postId, onSuccess }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createComment, null);

  useEffect(() => {
    if (state?.error) {
      toast.error("Erro ao comentar", { description: state.error });
    }
    if (state?.success) {
      toast.success("Comentario postado!");
      formRef.current?.reset();
      if (onSuccess) onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="workId" value={workId} />
      <input type="hidden" name="chapterId" value={chapterId} />
      <input type="hidden" name="parentId" value={parentId} />
      <input type="hidden" name="postId" value={postId} /> {/* Campo oculto para o ID do post */}
      
      <Textarea
        name="content"
        placeholder={parentId ? "Escreva sua resposta..." : "Deixe seu comentario..."}
        className="bg-[#0a0a0a] border-[#27272a] focus-visible:ring-[#FFD700] min-h-24"
        required
        minLength={3}
        maxLength={1000}
      />
      
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id={`isSpoiler-${parentId || postId || 'root'}`} name="isSpoiler" className="rounded border-zinc-700 bg-[#050505] text-[#FFD700] focus:ring-[#FFD700]" />
          <Label htmlFor={`isSpoiler-${parentId || postId || 'root'}`} className="text-sm text-zinc-400">Marcar como Spoiler</Label>
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}
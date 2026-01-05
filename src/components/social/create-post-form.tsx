"use client";

import { useRef, useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createPost } from "@/actions/social";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // <-- PASSO 1: Importar o useRouter

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="bg-[#FFD700] text-black font-bold rounded-full px-6 hover:bg-[#FFD700]/90"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Postar"}
    </Button>
  );
}

export function CreatePostForm({ userAvatar }: { userAvatar: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter(); // <-- PASSO 2: Inicializar o router
  
  const [state, formAction] = useActionState(createPost, null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Seu post foi publicado!");
      formRef.current?.reset();
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // <-- PASSO 3: Chamar o refresh para atualizar a UI
      router.refresh(); 
    }
    if (state?.error) {
      toast.error("Erro", { description: state.error });
    }
  }, [state, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border-b border-[#27272a] p-4">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userAvatar} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        <form ref={formRef} action={formAction} className="flex-1 space-y-4">
          <Textarea
            name="content"
            placeholder="O que está acontecendo?"
            className="bg-transparent border-none focus-visible:ring-0 text-lg p-0 resize-none"
            rows={2}
            required
          />

          {preview && (
            <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-zinc-700">
              <img src={preview} alt="Prévia da imagem" className="w-full h-auto" />
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 rounded-full h-8 w-8 text-white"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="w-4 h-4"/>
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-[#27272a]">
            <div>
              <input 
                type="file" 
                name="image" 
                ref={fileInputRef} 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                id="image-upload"
                onChange={handleFileChange}
              />
              <Label 
                htmlFor="image-upload" 
                className="cursor-pointer text-[#FFD700] p-2 rounded-full hover:bg-[#FFD700]/10"
              >
                <ImageIcon className="w-5 h-5" />
              </Label>
            </div>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
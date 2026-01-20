"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TermsModal } from "@/components/auth/terms-modal"; 

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
      <Card className="w-full max-w-md bg-[#111111] border-[#27272a] text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            Crie sua conta
          </CardTitle>
          {/* TEXTO ATUALIZADO: Removemos a menção das 5 patinhas */}
          <CardDescription className="text-zinc-400">
            Junte-se à nossa comunidade de leitores e acesse obras exclusivas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome de Usuário</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="SuperLeitor" 
                className="bg-[#050505] border-[#27272a] text-white" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="seu@email.com" 
                className="bg-[#050505] border-[#27272a] text-white" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Input 
                id="dateOfBirth" 
                name="dateOfBirth" 
                type="date" 
                className="bg-[#050505] border-[#27272a] text-white [color-scheme:dark]" 
                required 
              />
              <p className="text-xs text-zinc-500">Necessário para verificar a idade mínima (12 anos).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                className="bg-[#050505] border-[#27272a] text-white" 
                required 
              />
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="terms" 
                name="terms" 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-[#050505] accent-[#FFD700]"
                required 
              />
              <label htmlFor="terms" className="text-sm text-zinc-400 leading-none">
                Eu li e aceito os 
                <TermsModal onAccept={() => setTermsAccepted(true)} />.
              </label>
            </div>

            {state?.error && (
              <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-green-400 text-sm bg-green-900/20 p-2 rounded border border-green-900">{state.success}</p>
            )}

            <Button disabled={isPending} className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90 mt-4">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-[#27272a] mt-2 pt-4">
          <p className="text-sm text-zinc-400">
            Já tem conta?{" "}
            <Link href="/login" className="text-[#FFD700] hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
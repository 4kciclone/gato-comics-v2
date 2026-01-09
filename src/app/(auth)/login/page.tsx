"use client";

import Link from "next/link";
import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Cat, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4">
      {/* Campo oculto para manter o redirecionamento original */}
      <input type="hidden" name="redirectTo" value={callbackUrl || "/"} />

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
        <div className="flex items-center justify-between">
           <Label htmlFor="password">Senha</Label>
           <Link href="#" className="text-xs text-[#FFD700] hover:underline">Esqueceu?</Link>
        </div>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          className="bg-[#050505] border-[#27272a] text-white" 
          required 
        />
      </div>
      
      {state?.error && (
        <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-900/50">
          {state.error}
        </div>
      )}

      <Button 
        type="submit"
        disabled={isPending} 
        className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90 transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
      <Card className="w-full max-w-md bg-[#111111] border-[#27272a] text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-[#FFD700]/10 p-3 rounded-full w-fit">
             <Cat className="w-8 h-8 text-[#FFD700]" />
          </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-zinc-400">
            Entre para acessar sua coleção e patinhas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
            <LoginForm />
          </Suspense>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-[#27272a] mt-2 pt-6">
          <p className="text-sm text-zinc-400">
            Não tem conta?{" "}
            <Link href="/register" className="text-[#FFD700] hover:underline font-medium">
              Criar agora
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
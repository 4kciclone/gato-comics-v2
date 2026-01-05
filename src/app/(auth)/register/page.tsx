"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
      <Card className="w-full max-w-md bg-[#111111] border-[#27272a] text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
          <CardDescription className="text-zinc-400">
            Ganhe 5 Patinhas Grátis ao se cadastrar!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome de Usuário</Label>
              <Input id="name" name="name" placeholder="SuperLeitor" className="bg-[#050505] border-[#27272a]" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" className="bg-[#050505] border-[#27272a]" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" className="bg-[#050505] border-[#27272a]" required />
            </div>

            {state?.error && (
              <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-green-400 text-sm bg-green-900/20 p-2 rounded border border-green-900">{state.success}</p>
            )}

            <Button disabled={isPending} className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
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
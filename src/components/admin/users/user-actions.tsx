"use client";

import { useActionState } from "react";
import { grantBonus, updateUserRole } from "@/actions/users";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Shield, Coins, Loader2 } from "lucide-react";
import { UserRole } from "@prisma/client";

interface UserActionsProps {
  user: {
    id: string;
    role: UserRole;
  };
}

export function UserActions({ user }: UserActionsProps) {
  const [grantState, grantAction, isGrantPending] = useActionState(grantBonus, null);
  const [roleState, roleAction, isRolePending] = useActionState(updateUserRole, null);

  if (grantState?.success) toast.success(grantState.success);
  if (grantState?.error) toast.error(grantState.error);
  if (roleState?.success) toast.success(roleState.success);
  if (roleState?.error) toast.error(roleState.error);

  return (
    <div className="flex gap-2 justify-end">
      {/* Modal de Bônus */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-[#FFD700]">
            <Coins className="w-4 h-4 mr-2" /> Dar Bônus
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#111] border-[#27272a] text-white">
          <DialogHeader>
            <DialogTitle>Conceder Bônus de Patinhas</DialogTitle>
          </DialogHeader>
          <form action={grantAction} className="space-y-4 py-4">
            <input type="hidden" name="userId" value={user.id} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input name="amount" type="number" required />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="currency" required>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREMIUM">Premium 💎</SelectItem>
                    <SelectItem value="LITE">Lite 🐾</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input name="reason" placeholder="Ex: Prêmio de Evento" required />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isGrantPending} className="bg-[#FFD700] text-black">
                {isGrantPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Conceder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Cargo */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-white">
            <Shield className="w-4 h-4 mr-2" /> Editar Cargo
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#111] border-[#27272a] text-white">
          <DialogHeader><DialogTitle>Alterar Cargo do Usuário</DialogTitle></DialogHeader>
          <form action={roleAction} className="space-y-4 py-4">
            <input type="hidden" name="userId" value={user.id} />
            <Select name="role" defaultValue={user.role} required>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="OWNER">OWNER</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isRolePending}>
                {isRolePending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
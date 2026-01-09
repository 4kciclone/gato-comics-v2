import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Crown, CheckCircle } from "lucide-react";
// O componente de interatividade que criaremos a seguir
import { EntitlementManager } from "@/components/profile/entitlement-manager";

export default async function SubscriptionPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Busca todos os dados relevantes do usuário e suas obras
    const [user, allWorks] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            include: { 
                workEntitlements: {
                    include: { work: true }
                }
            }
        }),
        prisma.work.findMany({ where: { isHidden: false }, orderBy: { title: 'asc' } })
    ]);

    if (!user || !user.subscriptionTier) {
        return (
            <div className="container text-center py-20">
                <h1 className="text-2xl font-bold">Você não tem uma assinatura ativa.</h1>
                <p className="text-zinc-400 mb-6">Assine um plano para desbloquear obras e ganhar benefícios.</p>
                <Link href="/shop"><Button>Ver Planos</Button></Link>
            </div>
        );
    }
    
    const planKey = `sub_${user.subscriptionTier.toLowerCase()}`;
    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];

    const isWithinChangeWindow = user.entitlementChangeUntil ? user.entitlementChangeUntil > new Date() : false;

    return (
        <div className="container mx-auto px-4 py-12 space-y-12">
            <header className="text-center">
                <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] px-4 py-1.5 rounded-full text-xs font-bold mb-4">
                    <Crown className="w-4 h-4" /> Assinante {plan.label}
                </div>
                <h1 className="text-4xl font-bold text-white">Gerenciar Assinatura</h1>
                {user.subscriptionValidUntil && (
                    <p className="text-zinc-400 mt-2">Sua assinatura é válida até {new Date(user.subscriptionValidUntil).toLocaleDateString('pt-BR')}.</p>
                )}
            </header>

            <Card className="bg-[#111] border-[#27272a] max-w-4xl mx-auto">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Vínculos de Obras</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Você tem <strong className="text-white">{plan.works}</strong> {plan.works > 1 ? 'slots' : 'slot'} de obras para desbloquear com sua assinatura.
                            </CardDescription>
                        </div>
                        {isWithinChangeWindow ? (
                             <Badge className="bg-blue-600 text-white">Janela de Troca Aberta</Badge>
                        ) : (
                             <Badge variant="secondary">Janela de Troca Fechada</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Componente Cliente para gerenciar a seleção e remoção */}
                    <EntitlementManager
                        entitledWorks={user.workEntitlements}
                        allWorks={allWorks}
                        maxSlots={plan.works}
                        canChange={isWithinChangeWindow}
                    />
                </CardContent>
            </Card>

            <div className="text-center">
                <p className="text-zinc-500 text-sm">Precisa alterar ou cancelar sua assinatura?</p>
                {/* O link para o Portal do Cliente da Stripe será implementado depois */}
                <Button variant="link" className="text-[#FFD700]">Gerenciar Cobrança no Stripe</Button>
            </div>
        </div>
    );
}
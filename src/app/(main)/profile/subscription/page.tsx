import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Crown, CheckCircle, CalendarDays, ExternalLink, AlertTriangle } from "lucide-react";
import { EntitlementManager } from "@/components/profile/entitlement-manager";
import { CancelSubscriptionButton } from "@/components/profile/cancel-button";
import { createCustomerPortal } from "@/actions/stripe";
import Stripe from "stripe";

interface PageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function SubscriptionPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const session = await auth();
    
    if (!session?.user?.id) redirect("/login");

    // Query otimizada
    const [user, allWorks] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            include: { 
                workEntitlements: { include: { work: { select: { id: true, title: true, coverUrl: true } } } }
            }
        }),
        prisma.work.findMany({ 
            where: { isHidden: false }, 
            orderBy: { title: 'asc' },
            select: { id: true, title: true, coverUrl: true } 
        })
    ]);

    if (!user) redirect("/");

    const isSubActive = user.subscriptionTier && 
                        user.subscriptionValidUntil && 
                        new Date(user.subscriptionValidUntil) > new Date();

    // Feedback de carregamento pós-pagamento
    if (searchParams.success === "true" && !isSubActive) {
        return (
            <div className="container mx-auto px-4 py-32 text-center space-y-6 max-w-md">
                <div className="mx-auto w-12 h-12 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
                <div>
                    <h1 className="text-xl font-bold text-white">Sincronizando assinatura...</h1>
                    <p className="text-sm text-zinc-400 mt-2">O cofre da guilda está processando seu pagamento.</p>
                </div>
                <Button variant="outline" className="border-zinc-800 text-white" asChild>
                    <Link href="/profile/subscription">Atualizar Status</Link>
                </Button>
            </div>
        );
    }

    if (!isSubActive) {
        return (
            <div className="container mx-auto px-4 py-24 text-center space-y-8 max-w-lg">
                <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center border border-zinc-800 mx-auto">
                    <Crown className="w-10 h-10 text-zinc-600" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">Sem assinatura ativa</h1>
                    <p className="text-zinc-400">
                        Assine um plano para desbloquear slots de obras, remover anúncios e ganhar patinhas mensais.
                    </p>
                </div>
                <Button asChild className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90 h-12 px-8">
                    <Link href="/shop">Ver Planos Disponíveis</Link>
                </Button>
            </div>
        );
    }
    
    // Buscar status real no Stripe (Safety Check)
    let isCanceled = false;
    try {
        if (user.subscriptionId) {
            const stripeSub = await stripe.subscriptions.retrieve(user.subscriptionId);
            isCanceled = stripeSub.cancel_at_period_end;
        }
    } catch (e) {
        console.error("Erro de conexão com Stripe (Visualização apenas):", e);
        // Não quebra a página se o Stripe falhar, assume estado atual do banco se possível ou false
    }

    const planKey = `sub_${user.subscriptionTier!.toLowerCase()}`;
    // Fallback seguro se o plano não existir na config
    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS] || { label: user.subscriptionTier, works: 0 };
    const isWithinChangeWindow = user.entitlementChangeUntil ? new Date(user.entitlementChangeUntil) > new Date() : false;

    return (
        <div className="container mx-auto px-4 py-12 space-y-10 max-w-7xl">
            
            {/* Header com Status */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#27272a] pb-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <Crown className="w-3 h-3" /> Membro {plan.label}
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Minha Assinatura</h1>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-zinc-400 text-sm">
                            <span className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" /> 
                                Válida até <span className="text-white">{user.subscriptionValidUntil?.toLocaleDateString('pt-BR')}</span>
                            </span>
                            {!isCanceled ? (
                                <span className="flex items-center gap-2 text-green-400 bg-green-950/20 px-2 py-0.5 rounded border border-green-900/30">
                                    <CheckCircle className="w-3 h-3" /> Renovação Automática
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-yellow-500 bg-yellow-950/20 px-2 py-0.5 rounded border border-yellow-900/30">
                                    <AlertTriangle className="w-3 h-3" /> Cancela ao fim do período
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                <form action={createCustomerPortal}>
                    <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 w-full md:w-auto">
                        Faturas e Cartões <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ÁREA PRINCIPAL: Gerenciador de Obras */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-[#0a0a0a] border-[#27272a]">
                        <CardHeader className="border-b border-[#27272a] bg-[#111]">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg text-white">Slots de Leitura</CardTitle>
                                    <CardDescription className="text-zinc-400">
                                        Gerencie as obras desbloqueadas pelo seu plano.
                                    </CardDescription>
                                </div>
                                {isWithinChangeWindow ? (
                                     <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0">Troca Aberta</Badge>
                                ) : (
                                     <Badge variant="outline" className="border-zinc-700 text-zinc-500">Troca Fechada</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <EntitlementManager
                                entitledWorks={user.workEntitlements as any}
                                allWorks={allWorks}
                                maxSlots={plan.works}
                                canChange={isWithinChangeWindow}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* SIDEBAR: Ações */}
                <div className="space-y-6">
                    <Card className="bg-[#111] border-[#27272a]">
                        <CardHeader><CardTitle className="text-base text-white">Status do Plano</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 text-sm space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Plano</span>
                                    <span className="text-white font-bold">{plan.label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Obras</span>
                                    <span className="text-white font-bold">{plan.works} slots</span>
                                </div>
                            </div>

                            <CancelSubscriptionButton isCanceled={isCanceled} />
                            
                            <p className="text-xs text-center text-zinc-600 leading-relaxed px-2">
                                {isCanceled 
                                    ? "Seu acesso continuará normal até o fim do período vigente."
                                    : "Ao cancelar, você mantém os benefícios até a data de vencimento."}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
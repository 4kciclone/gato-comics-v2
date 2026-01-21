import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { COIN_PACKS, SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { SubscriptionTier } from "@prisma/client";

// Inicializa o Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore - Ignoramos erro de versão pois estamos usando uma feature flag específica
  apiVersion: "2025-12-15.clover", 
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;
  
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Webhook signature verification failed: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Casting global do objeto data para any para evitar erros de tipagem
  const session = event.data.object as any;
  
  try {
    // ====================================================
    // EVENTO 1: CHECKOUT CONCLUÍDO (Compras e 1ª Assinatura)
    // ====================================================
    if (event.type === "checkout.session.completed") {
      const userId = session.metadata?.userId;
      
      if (!userId) {
        return new NextResponse("Webhook Error: userId ausente.", { status: 200 });
      }

      // --- COMPRA DE PACOTE AVULSO ---
      if (session.mode === 'payment' && session.metadata?.type === 'PACK') {
        const packKey = session.metadata?.packKey;
        const pack = packKey ? COIN_PACKS[packKey] : undefined;

        if (pack) {
          await prisma.$transaction([
            prisma.user.update({ where: { id: userId }, data: { balancePremium: { increment: pack.premium } } }),
            prisma.transaction.create({
              data: { userId, amount: pack.premium, currency: "PREMIUM", type: "DEPOSIT", description: `Pacote: ${pack.label}` }
            }),
            ...(pack.lite > 0 ? [
              prisma.liteCoinBatch.create({
                data: { userId, amount: pack.lite, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
              }),
              prisma.transaction.create({
                data: { userId, amount: pack.lite, currency: "LITE", type: "EARN", description: `Bônus: ${pack.label}` }
              })
            ] : [])
          ]);
          console.log(`💰 Pacote entregue para ${userId}`);
        }
      } 
      
      // --- PRIMEIRA ASSINATURA (Ativação) ---
      else if (session.mode === 'subscription') {
        const planKey = session.metadata?.planKey;
        const plan = planKey ? SUBSCRIPTION_PLANS[planKey] : undefined;
        
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (subscriptionId && plan) {
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Casting seguro para acessar current_period_end
          const periodEndTimestamp = (subscriptionData as any).current_period_end;
          
          // Fallback de segurança para data
          const validDate = periodEndTimestamp 
            ? new Date(periodEndTimestamp * 1000) 
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          const tierKey = planKey?.split('_')[1]?.toUpperCase();
          const tier = tierKey as SubscriptionTier;

          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: {
                stripeCustomerId: customerId,
                subscriptionId: subscriptionId,
                subscriptionTier: tier,
                subscriptionValidUntil: validDate,
              }
            }),
            // Limpa slots anteriores por garantia
            prisma.workEntitlement.deleteMany({
                 where: { userId }
            }),
            // Entrega Patinhas Lite Mensais
            prisma.liteCoinBatch.create({
              data: { userId, amount: plan.monthlyPaws, expiresAt: validDate }
            }),
            prisma.transaction.create({
              data: { userId, amount: plan.monthlyPaws, currency: "LITE", type: "EARN", description: `Assinatura Iniciada: ${plan.label}` }
            }),
            prisma.activityLog.create({
              data: { type: 'NEW_SUBSCRIPTION', message: `Assinou o plano ${plan.label}`, metadata: { userId } }
            })
          ]);
          console.log(`👑 Assinatura ${plan.label} ativada para ${userId}`);
        }
      }
    }

    // ====================================================
    // EVENTO 2: RENOVAÇÃO AUTOMÁTICA (Fatura Paga)
    // ====================================================
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      
      // Ignora se for a criação inicial (já tratada acima)
      if (invoice.billing_reason === 'subscription_create') {
        return new NextResponse(null, { status: 200 });
      }

      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription?.id;

      if (subscriptionId) {
        const user = await prisma.user.findFirst({
          where: { subscriptionId: subscriptionId }
        });

        if (!user) {
          // Retorna 200 para não travar o Stripe em caso de race condition
          return new NextResponse(null, { status: 200 });
        }

        if (user.subscriptionTier) {
          const planKey = `sub_${user.subscriptionTier.toLowerCase()}`;
          const plan = SUBSCRIPTION_PLANS[planKey];
          
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEndTimestamp = (subscriptionData as any).current_period_end;
          const validDate = new Date(periodEndTimestamp * 1000);

          if (plan) {
            await prisma.$transaction([
              // 1. Estende a validade
              prisma.user.update({
                where: { id: user.id },
                data: {
                  subscriptionValidUntil: validDate,
                }
              }),
              
              // 2. RESET DE SLOTS (Logica de consumo mensal)
              // Removemos todos os vínculos para o usuário escolher novamente neste mês
              prisma.workEntitlement.deleteMany({
                where: { userId: user.id }
              }),

              // 3. Deposita as Patinhas do novo mês
              prisma.liteCoinBatch.create({ 
                data: { userId: user.id, amount: plan.monthlyPaws, expiresAt: validDate } 
              }),

              // 4. Log
              prisma.transaction.create({ 
                data: { userId: user.id, amount: plan.monthlyPaws, currency: "LITE", type: "EARN", description: `Renovação Automática: ${plan.label}` } 
              })
            ]);
            console.log(`🔄 Renovação processada e slots resetados para ${user.email}`);
          }
        }
      }
    }
  
    // ====================================================
    // EVENTO 3: CANCELAMENTO
    // ====================================================
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      
      await prisma.user.updateMany({
        where: { subscriptionId: subscription.id },
        data: { 
          subscriptionTier: null, 
          subscriptionValidUntil: null, 
          entitlementChangeUntil: null 
        }
      });
      console.log(`🚫 Assinatura encerrada: ${subscription.id}`);
    }

  } catch (error) {
    console.error("❌ Erro fatal no Webhook:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
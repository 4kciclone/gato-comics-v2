import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { COIN_PACKS, SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { SubscriptionTier } from "@prisma/client";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;
  
  try {
    // --- Lida com todos os eventos do Checkout ---
    if (event.type === "checkout.session.completed") {
      const userId = session.metadata?.userId;
      if (!userId) return new NextResponse("Webhook Error: Metadados 'userId' ausente.", { status: 400 });
      
      // Caso: Compra avulsa de um Pacote de Moedas
      if (session.mode === 'payment' && session.metadata?.type === 'PACK') {
        const packKey = session.metadata?.packKey;
        if (!packKey) return new NextResponse("Webhook Error: Metadados 'packKey' ausente.", { status: 400 });

        const pack = COIN_PACKS[packKey as keyof typeof COIN_PACKS];
        if (!pack) return new NextResponse(`Webhook Error: Pacote inválido '${packKey}'.`, { status: 400 });

        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { balancePremium: { increment: pack.premium } }
          }),
          prisma.transaction.create({
            data: { userId, amount: pack.premium, currency: "PREMIUM", type: "DEPOSIT", description: `Compra do Pacote: ${pack.label}` }
          }),
          ...(pack.lite > 0 ? [
            prisma.liteCoinBatch.create({
              data: { userId, amount: pack.lite, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
            }),
            prisma.transaction.create({
              data: { userId, amount: pack.lite, currency: "LITE", type: "EARN", description: `Bônus do Pacote: ${pack.label}` }
            })
          ] : [])
        ]);
        console.log(`💰 Pacote '${pack.label}' creditado para o usuário ${userId}`);
      } 
      // Caso: Nova Assinatura
      else if (session.mode === 'subscription') {
        const planKey = session.metadata?.planKey;
        if (!planKey) return new NextResponse("Webhook Error: Metadados 'planKey' ausente.", { status: 400 });

        const subscriptionId = session.subscription as string;
        const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
        const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];
        
        // Extrair current_period_end do objeto retornado
        const periodEnd = (subscriptionData as any).current_period_end;
        
        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionId: subscriptionData.id,
            subscriptionTier: planKey.split('_')[1].toUpperCase() as SubscriptionTier,
            subscriptionValidUntil: new Date(periodEnd * 1000),
          }
        });
        
        if (user) {
          await prisma.activityLog.create({
            data: {
              type: 'NEW_SUBSCRIPTION',
              message: `${user.name || 'Um usuário'} assinou o plano ${plan.label}.`,
              link: user.username ? `/u/${user.username}` : undefined,
              metadata: { plan: plan.label, userId: user.id }
            }
          });
          console.log(`✨ Nova assinatura '${plan.label}' criada para o usuário ${userId}`);
        }
      }
    }

    // --- Lida com eventos de renovação de assinatura ---
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string | null;

      if (subscriptionId && typeof subscriptionId === 'string') {
        const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = (subscriptionData as any).current_period_end;
        
        const user = await prisma.user.findFirst({ 
          where: { subscriptionId: subscriptionData.id } 
        });

        if (user && user.subscriptionTier) {
          const planKey = `sub_${user.subscriptionTier.toLowerCase()}`;
          const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];
          
          await prisma.$transaction([
            prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionValidUntil: new Date(periodEnd * 1000),
                entitlementChangeUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              }
            }),
            prisma.liteCoinBatch.create({ 
              data: { 
                userId: user.id, 
                amount: plan.monthlyPaws, 
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
              } 
            }),
            prisma.transaction.create({ 
              data: { 
                userId: user.id, 
                amount: plan.monthlyPaws, 
                currency: "LITE", 
                type: "EARN", 
                description: `Renovacao Assinatura ${plan.label}` 
              } 
            })
          ]);
          
          console.log(`🔄 A assinatura '${plan.label}' foi renovada para o usuário ${user.id}`);
        }
      }
    }
  
    // --- Lida com o cancelamento da assinatura ---
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { subscriptionId: subscription.id },
        data: { 
          subscriptionTier: null, 
          subscriptionValidUntil: null, 
          entitlementChangeUntil: null 
        }
      });
      console.log(`🚫 Assinatura '${subscription.id}' cancelada.`);
    }

  } catch (error) {
    console.error("❌ Erro ao processar o webhook da Stripe:", error);
    return new NextResponse("Webhook processing error", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
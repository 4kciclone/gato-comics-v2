import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { SubscriptionTier } from "@prisma/client";
import type {
  StripeSubscriptionExpanded,
  StripeInvoiceWithSubscription,
  StripeCheckoutSessionWithSubscription,
} from "@/types/stripe-webhook";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Webhook Error: Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    // ========================================
    // Evento: Usuário assinou pela primeira vez
    // ========================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as StripeCheckoutSessionWithSubscription;

      // Apenas processar se for uma assinatura
      if (session.mode !== "subscription") {
        return new NextResponse(null, { status: 200 });
      }

      const userId = session.metadata?.userId;
      const planKey = session.metadata?.planKey;

      if (!userId || !planKey) {
        console.error("Missing metadata in checkout.session.completed");
        return new NextResponse("Webhook Error: Metadados ausentes.", { 
          status: 400 
        });
      }

      if (!session.subscription || typeof session.subscription !== "string") {
        console.error("Missing subscription ID in session");
        return new NextResponse("Webhook Error: Subscription ID ausente.", { 
          status: 400 
        });
      }

      const subscriptionResponse = await stripe.subscriptions.retrieve(
        session.subscription
      );

      const subscription = subscriptionResponse as unknown as StripeSubscriptionExpanded;

      const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];

      if (!plan) {
        console.error(`Invalid plan key: ${planKey}`);
        return new NextResponse("Webhook Error: Plano inválido.", { 
          status: 400 
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionId: subscription.id,
          subscriptionTier: planKey.split("_")[1].toUpperCase() as SubscriptionTier,
          subscriptionValidUntil: new Date(subscription.current_period_end * 1000),
        },
      });

      console.log(`✅ Subscription created for user ${userId}`);
    }

    // ========================================
    // Evento: Renovação automática paga com sucesso
    // ========================================
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as StripeInvoiceWithSubscription;

      // Ignorar faturas que não são de assinatura
      if (!invoice.subscription || typeof invoice.subscription !== "string") {
        return new NextResponse(null, { status: 200 });
      }

      const subscriptionId = invoice.subscription;

      const subscriptionResponse = await stripe.subscriptions.retrieve(
        subscriptionId
      );

      const subscription = subscriptionResponse as unknown as StripeSubscriptionExpanded;

      const user = await prisma.user.findFirst({
        where: { subscriptionId: subscription.id },
      });

      if (!user || !user.subscriptionTier) {
        console.error(`User not found for subscription ${subscription.id}`);
        return new NextResponse(null, { status: 200 });
      }

      const planKey = `sub_${user.subscriptionTier.toLowerCase()}`;
      const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];

      if (!plan) {
        console.error(`Invalid plan for tier: ${user.subscriptionTier}`);
        return new NextResponse(null, { status: 200 });
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionValidUntil: new Date(
              subscription.current_period_end * 1000
            ),
            entitlementChangeUntil: expiresAt,
          },
        }),
        prisma.liteCoinBatch.create({
          data: {
            userId: user.id,
            amount: plan.monthlyPaws,
            expiresAt,
          },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            amount: plan.monthlyPaws,
            currency: "LITE",
            type: "EARN",
            description: `Renovação Assinatura ${plan.label}`,
          },
        }),
      ]);

      console.log(`✅ Subscription renewed for user ${user.id}`);
    }

    // ========================================
    // Evento: Assinatura cancelada
    // ========================================
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.user.updateMany({
        where: { subscriptionId: subscription.id },
        data: {
          subscriptionTier: null,
          subscriptionValidUntil: null,
          entitlementChangeUntil: null,
        },
      });

      console.log(`🚫 Subscription deleted: ${subscription.id}`);
    }

    // ========================================
    // Evento: Pagamento falhou
    // ========================================
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as StripeInvoiceWithSubscription;

      if (!invoice.subscription || typeof invoice.subscription !== "string") {
        return new NextResponse(null, { status: 200 });
      }

      const subscriptionId = invoice.subscription;

      console.log(`⚠️ Payment failed for subscription: ${subscriptionId}`);
      
      // Opcional: Marcar usuário com status de pagamento falho
      await prisma.user.updateMany({
        where: { subscriptionId },
        data: {
          // Adicione um campo paymentStatus se tiver no schema
          // paymentStatus: "FAILED"
        },
      });
    }

    // ========================================
    // Evento: Assinatura atualizada (upgrade/downgrade)
    // ========================================
    if (event.type === "customer.subscription.updated") {
      const subscriptionResponse = event.data.object as Stripe.Subscription;
      const subscription = subscriptionResponse as unknown as StripeSubscriptionExpanded;

      const user = await prisma.user.findFirst({
        where: { subscriptionId: subscription.id },
      });

      if (!user) {
        return new NextResponse(null, { status: 200 });
      }

      // Atualizar data de validade se mudou
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionValidUntil: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });

      console.log(`🔄 Subscription updated: ${subscription.id}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook processing error:", err);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 500 });
  }
}
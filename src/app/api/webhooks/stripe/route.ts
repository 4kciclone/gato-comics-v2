import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Escuta apenas eventos de checkout completado
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Recupera os dados que salvamos no metadata
    const userId = session.metadata?.userId;
    const coinsAmount = Number(session.metadata?.coinsAmount);

    if (userId && coinsAmount) {
      console.log(`💰 Pagamento recebido! Creditando ${coinsAmount} patinhas para ${userId}`);

      // Transação Atômica: Cria histórico + Adiciona Saldo
      await prisma.$transaction([
        // 1. Registra a transação
        prisma.transaction.create({
          data: {
            userId,
            amount: coinsAmount,
            currency: "PREMIUM",
            type: "DEPOSIT",
            description: `Compra via Stripe (Session ${session.id})`,
            metadata: { stripeSessionId: session.id }
          }
        }),
        // 2. Atualiza o saldo do usuário
        prisma.user.update({
          where: { id: userId },
          data: {
            balancePremium: { increment: coinsAmount }
          }
        })
      ]);
    }
  }

  return new NextResponse(null, { status: 200 });
}
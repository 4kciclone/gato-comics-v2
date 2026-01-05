"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import Stripe from "stripe";
// Importamos a configuração do arquivo separado
import { COIN_PACKS, SUBSCRIPTION_PLANS } from "@/lib/shop-config";

export async function createCheckoutSession(itemId: string, type: 'pack' | 'sub') {
  const session = await auth();
  
  if (!session?.user?.email || !session.user.id) {
    redirect("/login");
  }

  let priceAmount = 0;
  let productName = "";
  let mode: Stripe.Checkout.SessionCreateParams.Mode = "payment";
  let metadata = {};

  if (type === 'pack') {
    const pack = COIN_PACKS[itemId as keyof typeof COIN_PACKS];
    if (!pack) throw new Error("Pacote inválido");
    
    priceAmount = pack.price;
    productName = `${pack.label} de Patinhas`;
    mode = "payment";
    
    metadata = {
      userId: session.user.id,
      type: 'PACK',
      premiumAmount: pack.premium.toString(),
      liteAmount: pack.lite.toString()
    };

  } else {
    const plan = SUBSCRIPTION_PLANS[itemId as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) throw new Error("Plano inválido");

    priceAmount = plan.price;
    productName = `Assinatura ${plan.label} (Mensal)`;
    mode = "subscription";

    metadata = {
      userId: session.user.id,
      type: 'SUBSCRIPTION',
      planId: itemId,
      monthlyPaws: plan.monthlyPaws.toString()
    };
  }

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: productName,
            description: type === 'sub' ? "Renovação automática mensal" : "Compra única",
          },
          unit_amount: priceAmount,
          recurring: type === 'sub' ? { interval: 'month' } : undefined,
        },
        quantity: 1,
      },
    ],
    mode: mode,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?canceled=true`,
    metadata: metadata,
    customer_email: session.user.email,
  });

  if (!stripeSession.url) {
    throw new Error("Falha ao gerar link");
  }

  redirect(stripeSession.url);
}
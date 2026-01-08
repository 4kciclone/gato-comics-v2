"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { COIN_PACKS, SUBSCRIPTION_PLANS } from "@/lib/shop-config";

export async function createCheckoutSession(itemId: string, type: 'pack' | 'sub') {
  const session = await auth();
  
  if (!session?.user?.id || !session.user.email) {
    return redirect("/login");
  }

  // Busca o usuário no banco para verificar se já existe um 'stripeCustomerId'
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true }
  });

  if (!user) {
    return redirect("/login");
  }

  // Cria um cliente na Stripe na primeira compra/assinatura do usuário
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: session.user.name || undefined,
      });
      stripeCustomerId = customer.id;
      // Salva o ID do cliente no nosso banco para futuras transações
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: stripeCustomerId },
      });
    } catch (error) {
        console.error("Erro ao criar cliente Stripe:", error);
        throw new Error("Não foi possível inicializar a transação.");
    }
  }

  let stripeSession: Stripe.Checkout.Session;

  try {
    if (type === 'pack') {
      const pack = COIN_PACKS[itemId as keyof typeof COIN_PACKS];
      if (!pack) throw new Error("Pacote inválido");
      
      stripeSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `${pack.label} de Patinhas`,
                description: `${pack.premium} Patinhas Premium + ${pack.lite} Bônus Lite`,
              },
              unit_amount: pack.price, // Valor em centavos
            },
            quantity: 1,
          },
        ],
        mode: "payment", // Compra única
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?canceled=true`,
        metadata: {
          userId: session.user.id,
          type: 'PACK',
          packKey: itemId, // ex: 'pack_chest'
        },
      });

    } else { // type === 'sub'
      const plan = SUBSCRIPTION_PLANS[itemId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) throw new Error("Plano de assinatura inválido");

      stripeSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          { 
            price: plan.priceId, // Usa o ID do preço criado no dashboard do Stripe
            quantity: 1 
          }
        ],
        mode: "subscription", // Pagamento recorrente
        allow_promotion_codes: true,
        // Redireciona para uma página de gerenciamento de assinatura
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/subscription?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop?canceled=true`,
        metadata: {
            userId: session.user.id,
            planKey: itemId, // ex: 'sub_gold'
        },
      });
    }
  } catch (error) {
    console.error("Erro ao criar sessão de checkout Stripe:", error);
    throw new Error("Não foi possível conectar com o sistema de pagamento.");
  }

  if (!stripeSession.url) {
    throw new Error("Falha ao gerar o link de pagamento.");
  }

  // Redireciona o usuário para a página de checkout da Stripe
  redirect(stripeSession.url);
}
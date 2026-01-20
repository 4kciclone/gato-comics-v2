"use server";

import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe"; // Certifique-se que exporta a instância do Stripe
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Redireciona para o Portal do Cliente do Stripe (Para trocar cartão, ver faturas, etc)
 */
export async function createCustomerPortal() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true }
  });

  if (!user?.stripeCustomerId) {
    throw new Error("Usuário não possui ID de cliente no Stripe");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/subscription`,
  });

  redirect(portalSession.url);
}

/**
 * Cancela a assinatura ao final do período vigente
 */
export async function cancelSubscription() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionId: true }
  });

  if (!user?.subscriptionId) {
    throw new Error("Nenhuma assinatura encontrada");
  }

  try {
    // Atualiza no Stripe para não renovar
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });
    
    // O Webhook cuidará de atualizar o banco quando o período realmente acabar,
    // mas revalidamos a página para (opcionalmente) mostrar status de "Cancelamento Agendado"
    revalidatePath("/profile/subscription");
    
    return { success: "Assinatura cancelada. Você manterá o acesso até o fim do período." };
  } catch (error) {
    console.error("Erro ao cancelar:", error);
    return { error: "Erro ao comunicar com o Stripe." };
  }
}

/**
 * Reativa uma assinatura que estava agendada para cancelar
 */
export async function resumeSubscription() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autorizado");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionId: true }
  });

  if (!user?.subscriptionId) throw new Error("Nenhuma assinatura encontrada");

  try {
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: false,
    });
    
    revalidatePath("/profile/subscription");
    return { success: "Assinatura reativada! A renovação automática voltou." };
  } catch (error) {
    return { error: "Erro ao reativar." };
  }
}
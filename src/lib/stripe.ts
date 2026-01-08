import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // CORREÇÃO: Usamos a versão exata que o seu TypeScript está pedindo.
  apiVersion: "2025-12-15.clover", 
  typescript: true,
});
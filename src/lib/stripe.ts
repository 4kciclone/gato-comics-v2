import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Atualizado para a versão que o seu SDK exige (conforme o erro)
  apiVersion: "2025-12-15.clover", 
  typescript: true,
});
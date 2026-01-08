import Stripe from "stripe";

export interface StripeSubscriptionExpanded {
  id: string;
  current_period_end: number;
  current_period_start: number;
  customer: string | Stripe.Customer;
  status: Stripe.Subscription.Status;
  items: Stripe.ApiList<Stripe.SubscriptionItem>;
  metadata: Stripe.Metadata;
}

export interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription: string | Stripe.Subscription;
}

export interface StripeCheckoutSessionWithSubscription extends Stripe.Checkout.Session {
  subscription: string | Stripe.Subscription;
}
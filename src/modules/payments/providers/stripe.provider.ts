import Stripe from "stripe";
import type { Payment } from "@prisma/client";
import { env } from "../../../config/env";
import { ApiError } from "../../../shared/errors/apiError";
import type {
  CheckoutInput,
  CheckoutSession,
  PaymentProvider,
  VerificationOutcome,
} from "./types";

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY)
    throw ApiError.unavailable(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (test mode key)",
    );
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckout({
    payment,
    planName,
    customer,
  }: CheckoutInput): Promise<CheckoutSession> {
    const stripe = getStripe();
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customer.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: payment.currency.toLowerCase(),
              unit_amount: payment.amount,
              product_data: { name: planName },
            },
          },
        ],
        metadata: { paymentId: payment.id },
        success_url: `${env.frontendUrl}/payment/success?payment=${payment.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.frontendUrl}/payment/cancel?payment=${payment.id}`,
      });
      if (!session.url) throw new Error("Stripe returned no checkout URL");
      return { checkoutUrl: session.url, sessionId: session.id };
    } catch (error) {
      console.error("[stripe] checkout creation failed", error);
      throw ApiError.badRequest(
        "Stripe could not create the checkout session. Check the plan currency and your Stripe keys",
      );
    }
  },

  async verify(payment: Payment): Promise<VerificationOutcome> {
    if (!payment.providerSessionId) return { state: "pending" };
    const session = await getStripe().checkout.sessions.retrieve(
      payment.providerSessionId,
    );
    if (session.payment_status === "paid") {
      const intent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      return { state: "paid", transactionId: intent ?? session.id };
    }
    if (session.status === "expired") return { state: "failed" };
    return { state: "pending" };
  },
};

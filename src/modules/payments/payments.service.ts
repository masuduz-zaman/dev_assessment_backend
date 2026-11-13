import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../shared/errors/apiError.js";
import { type Actor } from "../../shared/utils/actor";
import { auditService } from "../audit/audit.service";
import { notificationsService } from "../notifications/notifications.service";
import { getPaymentProvider } from "./providers";
import {
  matchesPayment,
  validateByValId,
} from "./providers/sslcommerz.provider";
import { getStripe } from "./providers/stripe.provider";

const paymentSelect = {
  id: true,
  amount: true,
  currency: true,
  provider: true,
  status: true,
  purpose: true,
  providerTransactionId: true,
  createdAt: true,
  updatedAt: true,
  plan: { select: { id: true, name: true } },
} as const;

/**
 * The only place a payment becomes PAID. updateMany with status PENDING makes it idempotent:
 * webhook, redirect and manual verify can all race without double-processing.
 */
async function markPaid(paymentId: string, transactionId: string) {
  const result = await prisma.payment.updateMany({
    where: { id: paymentId, status: "PENDING" },
    data: { status: "PAID", providerTransactionId: transactionId },
  });
  if (result.count === 0) return false;

  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
  });
  await notificationsService.notify(
    payment.userId,
    "Payment received",
    `Your payment for "${payment.purpose}" was confirmed.`,
  );
  await auditService.log({
    actorId: payment.userId,
    action: "payment.paid",
    entity: "Payment",
    entityId: payment.id,
    metadata: { provider: payment.provider },
  });
  return true;
}

async function markUnpaid(paymentId: string, status: "FAILED" | "CANCELLED") {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: "PENDING" },
    data: { status },
  });
}

export const paymentsService = {
  async checkout(actor: Actor, planId: string) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, active: true },
    });
    if (!plan) throw ApiError.notFound("This plan is not available");

    const provider = getPaymentProvider();
    const customer = await prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: {
        name: true,
        email: true,
        candidate: { select: { phone: true } },
      },
    });

    const payment = await prisma.payment.create({
      data: {
        userId: actor.id,
        companyId: actor.companyId ?? null,
        planId: plan.id,
        amount: plan.amount,
        currency: plan.currency,
        provider: provider.name,
        purpose: plan.name,
      },
    });

    try {
      const session = await provider.createCheckout({
        payment,
        planName: plan.name,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.candidate?.phone,
        },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerSessionId: session.sessionId },
      });
      return {
        paymentId: payment.id,
        provider: provider.name,
        checkoutUrl: session.checkoutUrl,
      };
    } catch (error) {
      await markUnpaid(payment.id, "FAILED");
      throw error;
    }
  },

  listMine: (userId: string) =>
    prisma.payment.findMany({
      where: { userId },
      select: paymentSelect,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),

  async getMine(userId: string, id: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, userId },
      select: paymentSelect,
    });
    if (!payment) throw ApiError.notFound("Payment not found");
    return payment;
  },

  /** Re-checks a payment directly with the gateway. Used by the success page and safe to call repeatedly. */
  async verify(userId: string, id: string) {
    const payment = await prisma.payment.findFirst({ where: { id, userId } });
    if (!payment) throw ApiError.notFound("Payment not found");

    if (payment.status === "PENDING") {
      const outcome = await getPaymentProvider().verify(payment);
      if (outcome.state === "paid")
        await markPaid(payment.id, outcome.transactionId);
      else if (outcome.state === "failed")
        await markUnpaid(payment.id, "FAILED");
    }
    return paymentsService.getMine(userId, id);
  },

  // ---- Provider callbacks (no user session; authenticity is proven by the provider, never by the caller) ----

  async handleStripeEvent(rawBody: Buffer, signature: string | undefined) {
    if (!env.STRIPE_WEBHOOK_SECRET)
      throw ApiError.unavailable("Stripe webhook secret is not configured");
    if (!signature) throw ApiError.badRequest("Missing Stripe signature");

    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw ApiError.badRequest("Invalid Stripe webhook signature");
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;
      if (paymentId && session.payment_status === "paid") {
        const intent =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.id;
        await markPaid(paymentId, intent);
      }
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const paymentId = event.data.object.metadata?.paymentId;
      if (paymentId) await markUnpaid(paymentId, "FAILED");
    }
    return { received: true };
  },

  /** Shared by the SSLCommerz IPN and the success redirect. Confirms with the gateway before trusting anything. */
  async confirmSslcommerz(tranId: string, valId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: tranId } });
    if (!payment || payment.provider !== "sslcommerz")
      throw ApiError.notFound("Payment not found");
    if (payment.status === "PAID") return payment;

    const validated = await validateByValId(valId);
    if (!validated || !matchesPayment(payment, validated))
      throw ApiError.badRequest(
        "Payment could not be validated with SSLCommerz",
      );

    await markPaid(payment.id, validated.val_id);
    return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  },

  async closeSslcommerz(tranId: string, status: "FAILED" | "CANCELLED") {
    const payment = await prisma.payment.findUnique({ where: { id: tranId } });
    if (payment?.provider === "sslcommerz")
      await markUnpaid(payment.id, status);
  },
};

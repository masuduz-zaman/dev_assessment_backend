import type { Payment } from '@prisma/client';

export interface CheckoutInput {
  payment: Payment;
  planName: string;
  customer: { name: string; email: string; phone?: string | null };
}

export interface CheckoutSession {
  checkoutUrl: string;
  sessionId: string;
}

export type VerificationOutcome =
  | { state: 'paid'; transactionId: string }
  | { state: 'failed' }
  | { state: 'pending' };

/** Every gateway implements this contract; the payment service never touches provider specifics. */
export interface PaymentProvider {
  readonly name: 'stripe' | 'sslcommerz';
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /** Asks the gateway (server to server) whether this payment really succeeded. */
  verify(payment: Payment): Promise<VerificationOutcome>;
}

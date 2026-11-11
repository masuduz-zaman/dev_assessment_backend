import { env } from '../../../config/env';
import { sslcommerzProvider } from './sslcommerz.provider';
import { stripeProvider } from './stripe.provider';
import type { PaymentProvider } from './types';

export const getPaymentProvider = (): PaymentProvider => (env.PAYMENT_PROVIDER === 'stripe' ? stripeProvider : sslcommerzProvider);
export type { PaymentProvider } from './types';

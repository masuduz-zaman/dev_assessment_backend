import { z } from 'zod';

export const checkoutBody = z.object({ planId: z.string({ required_error: 'Choose a plan' }).min(1, 'Choose a plan') });
export const paymentIdParams = z.object({ id: z.string().min(1, 'Payment id is required') });

export type CheckoutInput = z.infer<typeof checkoutBody>;

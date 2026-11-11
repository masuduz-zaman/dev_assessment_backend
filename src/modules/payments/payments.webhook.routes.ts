import express, { Router } from 'express';
import { paymentsController } from './payments.controller';

/**
 * Provider callbacks. Mounted BEFORE express.json() because Stripe needs the raw body to verify its signature.
 * None of these trust the caller: every one re-validates with the payment gateway before touching a payment.
 */
const router = Router();
const form = express.urlencoded({ extended: false });

router.post('/stripe/webhook', express.raw({ type: 'application/json' }), paymentsController.stripeWebhook);

router.post('/sslcommerz/ipn', form, paymentsController.sslcommerzIpn);
router.all('/sslcommerz/success', form, paymentsController.sslcommerzSuccess);
router.all('/sslcommerz/fail', form, paymentsController.sslcommerzFail);
router.all('/sslcommerz/cancel', form, paymentsController.sslcommerzCancel);

export default router;

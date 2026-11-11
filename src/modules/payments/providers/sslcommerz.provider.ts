import axios from "axios";
import type { Payment } from "@prisma/client";
import { env } from "../../../config/env";
import { ApiError } from "../../../shared/errors/apiError";
import type {
  CheckoutInput,
  CheckoutSession,
  PaymentProvider,
  VerificationOutcome,
} from "./types";

const baseUrl = () =>
  env.SSLCOMMERZ_IS_LIVE
    ? "https://securepay.sslcommerz.com"
    : "https://sandbox.sslcommerz.com";
const FALLBACK_PHONE = "01700000000"; // SSLCommerz requires a phone number on every checkout request

function credentials() {
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    throw ApiError.unavailable(
      "SSLCommerz is not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD",
    );
  }
  return {
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
  };
}

export interface ValidatedTransaction {
  status: string;
  tran_id: string;
  val_id: string;
  amount: string;
  currency_type?: string;
  currency_amount?: string;
}

const isValid = (status: string) => ["VALID", "VALIDATED"].includes(status);

/** True only when the validated transaction really matches the payment we created. */
export function matchesPayment(payment: Payment, tx: ValidatedTransaction) {
  const charged = Math.round(Number(tx.currency_amount ?? tx.amount) * 100);
  const currencyOk =
    !tx.currency_type ||
    tx.currency_type.toUpperCase() === payment.currency.toUpperCase();
  return (
    isValid(tx.status) &&
    tx.tran_id === payment.id &&
    charged === payment.amount &&
    currencyOk
  );
}

/** Validates a val_id received on the success redirect / IPN against SSLCommerz. */
export async function validateByValId(
  valId: string,
): Promise<ValidatedTransaction | null> {
  const { data } = await axios.get(
    `${baseUrl()}/validator/api/validationserverAPI.php`,
    {
      params: { val_id: valId, ...credentials(), format: "json" },
      timeout: 20000,
    },
  );
  return data?.status ? (data as ValidatedTransaction) : null;
}

export const sslcommerzProvider: PaymentProvider = {
  name: "sslcommerz",

  async createCheckout({
    payment,
    planName,
    customer,
  }: CheckoutInput): Promise<CheckoutSession> {
    const callback = (path: string) =>
      `${env.API_URL}/api/payments/sslcommerz/${path}`;
    const body = new URLSearchParams({
      ...credentials(),
      total_amount: (payment.amount / 100).toFixed(2),
      currency: payment.currency,
      tran_id: payment.id,
      success_url: callback("success"),
      fail_url: callback("fail"),
      cancel_url: callback("cancel"),
      ipn_url: callback("ipn"),
      cus_name: customer.name,
      cus_email: customer.email,
      cus_add1: "Bangladesh",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: customer.phone || FALLBACK_PHONE,
      shipping_method: "NO",
      num_of_item: "1",
      product_name: planName,
      product_category: "Service",
      product_profile: "general",
    });

    try {
      const { data } = await axios.post(
        `${baseUrl()}/gwprocess/v4/api.php`,
        body,
        { timeout: 20000 },
      );
      if (data?.status !== "SUCCESS" || !data.GatewayPageURL) {
        console.error("[sslcommerz] session rejected:", data?.failedreason);
        throw new Error(data?.failedreason ?? "Gateway rejected the request");
      }
      return { checkoutUrl: data.GatewayPageURL, sessionId: data.sessionkey };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.badRequest(
        "SSLCommerz could not create the checkout session. Check your store credentials",
      );
    }
  },

  async verify(payment: Payment): Promise<VerificationOutcome> {
    const { data } = await axios.get(
      `${baseUrl()}/validator/api/merchantTransIDvalidationAPI.php`,
      {
        params: { tran_id: payment.id, ...credentials(), format: "json" },
        timeout: 20000,
      },
    );
    const elements: ValidatedTransaction[] = Array.isArray(data?.element)
      ? data.element
      : [];
    const confirmed = elements.find((tx) => matchesPayment(payment, tx));
    if (confirmed) return { state: "paid", transactionId: confirmed.val_id };
    if (
      elements.length > 0 &&
      elements.every((tx) =>
        ["FAILED", "CANCELLED", "EXPIRED", "UNATTEMPTED"].includes(tx.status),
      )
    )
      return { state: "failed" };
    return { state: "pending" };
  },
};

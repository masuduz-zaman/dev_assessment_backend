import type { Request, Response } from "express";
import { env } from "../../config/env";
import { ApiError } from "../../shared/errors/apiError";
import { actorFrom } from "../../shared/utils/actor";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { paymentsService } from "./payments.service";

const field = (req: Request, key: string) => {
  const value =
    (req.body as Record<string, unknown> | undefined)?.[key] ?? req.query[key];
  return typeof value === "string" ? value : "";
};

const redirectToFrontend = (
  res: Response,
  page: "success" | "cancel",
  paymentId: string,
  extra = "",
) =>
  res.redirect(
    303,
    `${env.frontendUrl}/payment/${page}?payment=${encodeURIComponent(paymentId)}${extra}`,
  );

export const paymentsController = {
  checkout: asyncHandler(async (req, res) => {
    sendCreated(
      res,
      await paymentsService.checkout(actorFrom(req), req.body.planId),
      "Checkout session created",
    );
  }),
  listMine: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await paymentsService.listMine(req.user!.id),
      "Payments fetched successfully",
    );
  }),
  getMine: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await paymentsService.getMine(req.user!.id, req.params.id),
      "Payment fetched successfully",
    );
  }),
  verify: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await paymentsService.verify(req.user!.id, req.params.id),
      "Payment status refreshed",
    );
  }),

  stripeWebhook: asyncHandler(async (req, res) => {
    const signature = req.headers["stripe-signature"];
    sendSuccess(
      res,
      await paymentsService.handleStripeEvent(
        req.body as Buffer,
        Array.isArray(signature) ? signature[0] : signature,
      ),
      "Webhook processed",
    );
  }),

  sslcommerzIpn: asyncHandler(async (req, res) => {
    const tranId = field(req, "tran_id");
    const valId = field(req, "val_id");
    if (!tranId || !valId) throw ApiError.badRequest("Invalid IPN payload");
    await paymentsService.confirmSslcommerz(tranId, valId);
    sendSuccess(res, { received: true }, "IPN processed");
  }),

  sslcommerzSuccess: asyncHandler(async (req, res) => {
    const tranId = field(req, "tran_id");
    const valId = field(req, "val_id");
    if (!tranId) return res.redirect(303, `${env.frontendUrl}/payments`);
    try {
      await paymentsService.confirmSslcommerz(tranId, valId);
      return redirectToFrontend(res, "success", tranId);
    } catch {
      return redirectToFrontend(
        res,
        "cancel",
        tranId,
        "&reason=validation_failed",
      );
    }
  }),

  sslcommerzFail: asyncHandler(async (req, res) => {
    const tranId = field(req, "tran_id");
    if (tranId) await paymentsService.closeSslcommerz(tranId, "FAILED");
    redirectToFrontend(res, "cancel", tranId, "&reason=failed");
  }),

  sslcommerzCancel: asyncHandler(async (req, res) => {
    const tranId = field(req, "tran_id");
    if (tranId) await paymentsService.closeSslcommerz(tranId, "CANCELLED");
    redirectToFrontend(res, "cancel", tranId, "&reason=cancelled");
  }),
};

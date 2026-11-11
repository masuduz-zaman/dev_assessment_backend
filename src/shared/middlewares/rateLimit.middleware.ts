import rateLimit from "express-rate-limit";
import { sendError } from "../utils/apiResponse";

const handler =
  (message: string) => (_req: unknown, res: Parameters<typeof sendError>[0]) =>
    sendError(res, 429, message);

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many requests. Please slow down and try again shortly"),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler(
    "Too many authentication attempts. Please try again in a few minutes",
  ),
});

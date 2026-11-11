import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import paymentWebhookRoutes from "./modules/payments/payments.webhook.routes";
import routes from "./routes";
import { apiLimiter } from "./shared/middlewares/rateLimit.middleware";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middlewares/error.middleware";

export function createApp() {
  const app = express();

  if (env.isProduction) app.set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // uploads are embedded by the frontend origin
  app.use(cors({ origin: env.corsOrigins, credentials: true }));

  // Provider callbacks need raw / urlencoded bodies, so they are mounted before express.json().
  app.use("/api/payments", paymentWebhookRoutes);

  app.use(express.json({ limit: "1mb" }));
  app.use("/api", apiLimiter);
  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

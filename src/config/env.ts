import "dotenv/config";
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((value) =>
    value && value.trim() !== "" ? value.trim() : undefined,
  );

const bool = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().min(1).default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:5000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(6, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),

  GOOGLE_CLIENT_ID: optional,

  PAYMENT_PROVIDER: z.enum(["sslcommerz", "stripe"]).default("sslcommerz"),
  SSLCOMMERZ_STORE_ID: optional,
  SSLCOMMERZ_STORE_PASSWORD: optional,
  SSLCOMMERZ_IS_LIVE: bool,
  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,

  UPLOAD_DIR: z.string().default("uploads"),
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,

  JUDGE0_BASE_URL: optional,
  JUDGE0_API_KEY: optional,

});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${details}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  /** First FRONTEND_URL entry, used for redirects. FRONTEND_URL may hold a comma separated CORS allow-list. */
  frontendUrl: parsed.data.FRONTEND_URL.split(",")[0].trim().replace(/\/$/, ""),
  corsOrigins: parsed.data.FRONTEND_URL.split(",").map((url) =>
    url.trim().replace(/\/$/, ""),
  ),
};

import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError, type FieldError } from "../errors/ApiError";
import { zodToFieldErrors } from "../utils/zod";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Server-side input validation. Parsed (and coerced / trimmed) values replace the raw request values,
 * so controllers and services only ever see validated data.
 */
export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req, _res, next) => {
    const errors: FieldError[] = [];

    for (const location of ["params", "query", "body"] as const) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location] ?? {});
      if (!result.success) {
        errors.push(
          ...zodToFieldErrors(
            result.error,
            location === "body" ? undefined : location,
          ),
        );
        continue;
      }

      Object.defineProperty(req, location, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    if (errors.length > 0)
      return next(ApiError.unprocessable("Validation failed", errors));
    next();
  };

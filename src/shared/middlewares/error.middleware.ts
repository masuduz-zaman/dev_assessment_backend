import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../../config/env";
import { ApiError } from "../errors/apiError";
import { sendError } from "../utils/apiResponse";
import { zodToFieldErrors } from "../utils/zod";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/** Converts every thrown error into { success: false, message, errors: [] }. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError)
    return sendError(res, err.statusCode, err.message, err.errors);

  if (err instanceof ZodError)
    return sendError(res, 422, "Validation failed", zodToFieldErrors(err));

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target =
        (err.meta?.target as string[] | string | undefined) ?? "value";
      const field = Array.isArray(target) ? target.join(", ") : String(target);
      return sendError(res, 409, `A record with this ${field} already exists`, [
        { field, message: "Must be unique" },
      ]);
    }
    if (err.code === "P2025") return sendError(res, 404, "Record not found");
    if (err.code === "P2003")
      return sendError(res, 400, "A related record does not exist");
  }

  if (
    err instanceof jwt.TokenExpiredError ||
    err instanceof jwt.JsonWebTokenError
  ) {
    return sendError(
      res,
      401,
      "Your session is invalid or expired. Please sign in again",
    );
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. The limit is 10MB"
        : err.message;
    return sendError(res, 400, message, [{ field: err.field, message }]);
  }

  const known = err as { type?: string };
  if (known?.type === "entity.parse.failed")
    return sendError(res, 400, "Malformed JSON in request body");
  if (known?.type === "entity.too.large")
    return sendError(res, 413, "Request body is too large");

  if (env.NODE_ENV !== "test") console.error("[unhandled error]", err);
  return sendError(res, 500, "Something went wrong");
};

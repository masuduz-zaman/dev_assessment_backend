import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../errors/ApiError";

export const allowRoles =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role))
      return next(ApiError.forbidden("Your role cannot access this resource"));
    next();
  };

export const requirePermission =
  (permission: string): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === "SUPER_ADMIN") return next();
    if (req.user.role !== "COMPANY" || !req.companyId)
      return next(ApiError.forbidden("Company access is required"));
    if (req.permissions?.includes("*") || req.permissions?.includes(permission))
      return next();
    next(ApiError.forbidden(`Missing permission: ${permission}`));
  };

export function requireCompanyId(companyId?: string): string {
  if (!companyId)
    throw ApiError.forbidden("Company context is required for this action");
  return companyId;
}

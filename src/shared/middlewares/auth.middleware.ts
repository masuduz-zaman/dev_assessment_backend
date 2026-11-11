import type { RequestHandler } from "express";
import { prisma } from "../../config/prisma";
import { ApiError } from "../errors/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyAccessToken } from "../utils/token";

/** Verifies the Bearer token, loads the user and (for company users) the company context. */
export const authenticate: RequestHandler = asyncHandler(
  async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      throw ApiError.unauthorized("Authentication required");

    let userId: string;
    try {
      userId = verifyAccessToken(header.slice(7)).id;
    } catch {
      throw ApiError.unauthorized(
        "Your session has expired. Please sign in again",
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== "ACTIVE")
      throw ApiError.unauthorized("Account unavailable");

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    if (user.role === "COMPANY") {
      const owned = await prisma.company.findUnique({
        where: { ownerId: user.id },
      });
      if (owned) {
        if (owned.status !== "APPROVED")
          throw ApiError.forbidden(
            "Company approval is pending or was rejected",
          );
        req.companyId = owned.id;
        req.permissions = ["*"];
      } else {
        const membership = await prisma.companyMember.findFirst({
          where: {
            userId: user.id,
            active: true,
            company: { status: "APPROVED" },
          },
        });
        if (membership) {
          req.companyId = membership.companyId;
          req.permissions = membership.permissions;
        }
      }
    }

    next();
  },
);

/** Optional authentication for public routes that behave differently for signed in users. */
export const authenticateOptional: RequestHandler = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
};

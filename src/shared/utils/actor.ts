import type { Request } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../errors/ApiError";

/** The signed in user plus their company context, passed from controllers into services. */
export interface Actor {
  id: string;
  role: Role;
  name: string;
  companyId?: string;
  permissions: string[];
}

export function actorFrom(req: Request): Actor {
  if (!req.user) throw ApiError.unauthorized();
  return {
    id: req.user.id,
    role: req.user.role,
    name: req.user.name,
    companyId: req.companyId,
    permissions: req.permissions ?? [],
  };
}

export const isAdmin = (actor: Actor) => actor.role === "SUPER_ADMIN";

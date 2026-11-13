import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError.js";
import { hashPassword } from "../../shared/utils/password";
import { notificationsService } from "../notifications/notifications.service";
import type { AddMemberInput, UpdateMemberInput } from "./team.validation";

interface Actor {
  companyId: string;
  permissions: string[];
}

/** Employees with team:manage can only hand out permissions they hold themselves. Owners hold '*'. */
function assertCanGrant(actor: Actor, requested: string[]) {
  if (actor.permissions.includes("*")) return;
  const missing = requested.filter(
    (permission) => !actor.permissions.includes(permission),
  );
  if (missing.length > 0)
    throw ApiError.forbidden(
      `You cannot grant permissions you do not have: ${missing.join(", ")}`,
    );
}

async function findOwnedMember(companyId: string, id: string) {
  const member = await prisma.companyMember.findFirst({
    where: { id, companyId },
  });
  if (!member) throw ApiError.notFound("Team member not found");
  return member;
}

export const teamService = {
  list(companyId: string) {
    return prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async add(actor: Actor, input: AddMemberInput) {
    assertCanGrant(actor, input.permissions);

    let user = await prisma.user.findUnique({ where: { email: input.email } });
    if (user) {
      const ownsCompany = await prisma.company.findUnique({
        where: { ownerId: user.id },
      });
      const otherMembership = await prisma.companyMember.findFirst({
        where: { userId: user.id, companyId: { not: actor.companyId } },
      });
      if (ownsCompany || otherMembership || user.role !== "COMPANY") {
        throw ApiError.conflict(
          "This email is already linked to another account or company. Use a new employee email",
        );
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: await hashPassword(input.password),
          role: "COMPANY",
          emailVerified: false,
        },
      });
    }

    const member = await prisma.companyMember.upsert({
      where: {
        companyId_userId: { companyId: actor.companyId, userId: user.id },
      },
      create: {
        companyId: actor.companyId,
        userId: user.id,
        memberRole: input.memberRole,
        permissions: input.permissions,
      },
      update: {
        memberRole: input.memberRole,
        permissions: input.permissions,
        active: true,
      },
    });

    await notificationsService.notify(
      user.id,
      "You were added to a company team",
      "Sign in to start working with your assigned permissions.",
    );
    return {
      member,
      employee: { id: user.id, name: user.name, email: user.email },
    };
  },

  async update(actor: Actor, id: string, input: UpdateMemberInput) {
    const member = await findOwnedMember(actor.companyId, id);
    if (input.permissions) assertCanGrant(actor, input.permissions);
    return prisma.companyMember.update({
      where: { id: member.id },
      data: input,
    });
  },

  async remove(actor: Actor, id: string) {
    const member = await findOwnedMember(actor.companyId, id);
    await prisma.companyMember.delete({ where: { id: member.id } });
    return { id: member.id, deleted: true };
  },
};

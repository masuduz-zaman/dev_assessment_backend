import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/ApiError";
import { type Actor, isAdmin } from "../../shared/utils/actor";
import { notificationsService } from "../notifications/notifications.service";
import type { CreateInvitationInput } from "./invitations.validation";

async function findCompanyAssessment(actor: Actor, assessmentId: string) {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      ...(isAdmin(actor) ? {} : { companyId: actor.companyId ?? "__none__" }),
    },
  });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  return assessment;
}

export const invitationsService = {
  async create(actor: Actor, input: CreateInvitationInput) {
    const assessment = await findCompanyAssessment(actor, input.assessmentId);
    if (assessment.status !== "PUBLISHED")
      throw ApiError.conflict(
        "Publish the assessment before inviting candidates",
      );

    const candidates = await prisma.user.findMany({
      where: {
        id: { in: input.candidateIds },
        role: "CANDIDATE",
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (candidates.length !== new Set(input.candidateIds).size) {
      throw ApiError.badRequest(
        "One or more selected candidates do not exist or are inactive",
      );
    }

    const invitations = await prisma.$transaction(
      candidates.map(({ id: candidateId }) =>
        prisma.assessmentInvitation.upsert({
          where: {
            assessmentId_candidateId: {
              assessmentId: assessment.id,
              candidateId,
            },
          },
          create: {
            assessmentId: assessment.id,
            candidateId,
            companyId: assessment.companyId,
            token: randomUUID(),
          },
          update: {},
        }),
      ),
    );

    await notificationsService.notifyMany(
      candidates.map((c) => c.id),
      "Assessment invitation",
      `You have been invited to "${assessment.title}". Accept the invitation to start the assessment.`,
    );
    return invitations;
  },

  listMine(candidateId: string) {
    return prisma.assessmentInvitation.findMany({
      where: { candidateId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            durationMinutes: true,
            totalMarks: true,
            status: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listForAssessment(actor: Actor, assessmentId: string) {
    await findCompanyAssessment(actor, assessmentId);
    return prisma.assessmentInvitation.findMany({
      where: { assessmentId },
      include: { candidate: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async accept(candidateId: string, id: string) {
    const invitation = await prisma.assessmentInvitation.findFirst({
      where: { id, candidateId },
    });
    if (!invitation) throw ApiError.notFound("Invitation not found");
    if (invitation.expiresAt && invitation.expiresAt < new Date())
      throw ApiError.badRequest("This invitation has expired");
    if (invitation.acceptedAt) return invitation;
    return prisma.assessmentInvitation.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });
  },
};

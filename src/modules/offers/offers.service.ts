import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/ApiError";
import { notificationsService } from "../notifications/notifications.service";
import type { CreateOfferInput } from "./offers.validation";

export const offersService = {
  async create(companyId: string, senderId: string, input: CreateOfferInput) {
    const candidate = await prisma.user.findFirst({
      where: { id: input.candidateId, role: "CANDIDATE", status: "ACTIVE" },
      select: { id: true },
    });
    if (!candidate) throw ApiError.notFound("Candidate not found");

    const offer = await prisma.employmentOffer.create({
      data: { ...input, companyId, senderId },
    });
    await notificationsService.notify(
      candidate.id,
      "Employment offer",
      `You received an offer for "${input.jobTitle}". Open your applications page to respond.`,
    );
    return offer;
  },

  listMine(candidateId: string) {
    return prisma.employmentOffer.findMany({
      where: { candidateId },
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  listForCompany(companyId: string) {
    return prisma.employmentOffer.findMany({
      where: { companyId },
      include: { candidate: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  async respond(
    candidateId: string,
    id: string,
    status: "ACCEPTED" | "REJECTED",
  ) {
    const offer = await prisma.employmentOffer.findFirst({
      where: { id, candidateId, status: "SENT" },
      include: { company: { select: { ownerId: true } } },
    });
    if (!offer) throw ApiError.notFound("Offer not found or already answered");

    const updated = await prisma.employmentOffer.update({
      where: { id },
      data: { status, respondedAt: new Date() },
    });
    await notificationsService.notify(
      offer.company.ownerId,
      "Offer response",
      `A candidate ${status.toLowerCase()} your offer for "${offer.jobTitle}".`,
    );
    return updated;
  },
};

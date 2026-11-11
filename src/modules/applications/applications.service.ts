import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError";
import { notificationsService } from "../notifications/notifications.service";
import type {
  ApplyInput,
  CompanyApplicationsQuery,
} from "./applications.validation";

export const applicationsService = {
  async apply(candidateId: string, input: ApplyInput) {
    const job = await prisma.jobPosition.findUnique({
      where: { id: input.jobId },
      include: { company: { select: { ownerId: true } } },
    });
    if (!job || job.status !== "OPEN")
      throw ApiError.notFound("This job is not open for applications");

    const already = await prisma.jobApplication.findUnique({
      where: { jobId_candidateId: { jobId: job.id, candidateId } },
    });
    if (already)
      throw ApiError.conflict("You have already applied to this job");

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
      select: { cvUrl: true },
    });
    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId,
        cvUrl: input.cvUrl ?? profile?.cvUrl ?? undefined,
        coverLetter: input.coverLetter,
      },
    });

    await notificationsService.notify(
      job.company.ownerId,
      "New job application",
      `A candidate applied for "${job.title}".`,
    );
    return application;
  },

  listMine(candidateId: string) {
    return prisma.jobApplication.findMany({
      where: { candidateId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            employmentType: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  listForCompany(companyId: string, query: CompanyApplicationsQuery) {
    return prisma.jobApplication.findMany({
      where: {
        job: { companyId, ...(query.jobId ? { id: query.jobId } : {}) },
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        job: { select: { id: true, title: true } },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            candidate: {
              select: {
                headline: true,
                skills: true,
                location: true,
                cvUrl: true,
                portfolioUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  async updateStatus(
    companyId: string,
    id: string,
    status: "REVIEWING" | "SHORTLISTED" | "REJECTED" | "HIRED",
  ) {
    const application = await prisma.jobApplication.findFirst({
      where: { id, job: { companyId } },
      include: { job: { select: { title: true } } },
    });
    if (!application) throw ApiError.notFound("Application not found");

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status },
    });
    await notificationsService.notify(
      application.candidateId,
      "Application update",
      `Your application for "${application.job.title}" is now ${status.toLowerCase()}.`,
    );
    return updated;
  },
};

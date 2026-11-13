import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/ApiError";
import type { CreateJobInput, UpdateJobInput } from "./jobs.validation";

async function findOwned(companyId: string, id: string) {
  const job = await prisma.jobPosition.findFirst({ where: { id, companyId } });
  if (!job) throw ApiError.notFound("Job not found");
  return job;
}

export const jobsService = {
  listForCompany(companyId: string) {
    return prisma.jobPosition.findMany({
      where: { companyId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  create(companyId: string, input: CreateJobInput) {
    return prisma.jobPosition.create({ data: { ...input, companyId } });
  },

  async update(companyId: string, id: string, input: UpdateJobInput) {
    await findOwned(companyId, id);
    return prisma.jobPosition.update({ where: { id }, data: input });
  },

  async remove(companyId: string, id: string) {
    await findOwned(companyId, id);
    await prisma.jobPosition.delete({ where: { id } });
    return { id, deleted: true };
  },
};

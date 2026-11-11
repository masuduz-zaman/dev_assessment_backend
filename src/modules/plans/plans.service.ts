import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError";
import type { CreatePlanInput, UpdatePlanInput } from "./plans.validation";

export const plansService = {
  listActive: () =>
    prisma.plan.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { amount: "asc" }],
    }),
  listAll: () =>
    prisma.plan.findMany({
      orderBy: [{ sortOrder: "asc" }, { amount: "asc" }],
    }),
  create: (input: CreatePlanInput) => prisma.plan.create({ data: input }),

  async update(id: string, input: UpdatePlanInput) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw ApiError.notFound("Plan not found");
    return prisma.plan.update({ where: { id }, data: input });
  },
};

import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError.js";

const PUBLIC_SCOPE = "PUBLIC";

async function recalculate(candidateId: string, scope: string) {
  const assessmentFilter: Prisma.AssessmentWhereInput =
    scope === PUBLIC_SCOPE ? { visibility: "PUBLIC" } : { companyId: scope };

  const [results, totalAttempts] = await Promise.all([
    prisma.assessmentResult.findMany({
      where: {
        candidateId,
        status: { in: ["PASSED", "FAILED"] },
        assessment: assessmentFilter,
      },
    }),
    prisma.assessmentAttempt.count({
      where: { candidateId, assessment: assessmentFilter },
    }),
  ]);

  const possibleMarks = results.reduce((sum, r) => sum + r.totalMarks, 0);
  const obtainedMarks = results.reduce((sum, r) => sum + r.obtainedMarks, 0);
  const data = {
    totalAttempts,
    completedAttempts: results.length,
    passedCount: results.filter((r) => r.status === "PASSED").length,
    obtainedMarks,
    possibleMarks,
    percentage: possibleMarks ? (obtainedMarks / possibleMarks) * 100 : 0,
  };

  return prisma.candidateRanking.upsert({
    where: { candidateId_companyId: { candidateId, companyId: scope } },
    create: { candidateId, companyId: scope, ...data },
    update: data,
  });
}

export const rankingsService = {
  /** Called whenever a result becomes final. Updates the public leaderboard and the owning company's leaderboard. */
  async recalculateFor(
    candidateId: string,
    assessment: { visibility: string; companyId: string | null },
  ) {
    const scopes: string[] = [];
    if (assessment.visibility === "PUBLIC") scopes.push(PUBLIC_SCOPE);
    if (assessment.companyId) scopes.push(assessment.companyId);
    await Promise.all(scopes.map((scope) => recalculate(candidateId, scope)));
  },

  async list(scope: "public" | "company", companyId?: string) {
    if (scope === "company" && !companyId)
      throw ApiError.forbidden(
        "Company rankings are only available to company accounts",
      );
    const rows = await prisma.candidateRanking.findMany({
      where: {
        companyId: scope === "company" ? companyId : PUBLIC_SCOPE,
        completedAttempts: { gt: 0 },
      },
      orderBy: [
        { percentage: "desc" },
        { passedCount: "desc" },
        { completedAttempts: "desc" },
      ],
      take: 100,
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            candidate: { select: { headline: true } },
          },
        },
      },
    });
    return rows.map((row, index) => ({
      rank: index + 1,
      candidateId: row.candidateId,
      name: row.candidate.name,
      avatarUrl: row.candidate.avatarUrl,
      headline: row.candidate.candidate?.headline ?? null,
      percentage: Math.round(row.percentage * 10) / 10,
      passedCount: row.passedCount,
      completedAttempts: row.completedAttempts,
      obtainedMarks: row.obtainedMarks,
      possibleMarks: row.possibleMarks,
    }));
  },
};

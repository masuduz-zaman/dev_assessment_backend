import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError";
import {
  CODING_LANGUAGES,
  EMPLOYMENT_TYPES,
  ASSESSMENT_VISIBILITY,
  QUESTION_TYPES,
} from "../../constants/options";
import { MEMBER_ROLES, PERMISSIONS } from "../../constants/permissions";
import type { PublicJobsQuery, PublicSearchQuery } from "./public.validation";

const contains = (value: string) => ({
  contains: value,
  mode: "insensitive" as const,
});

export const publicService = {
  listAssessments(query: PublicSearchQuery) {
    const where: Prisma.AssessmentWhereInput = {
      visibility: "PUBLIC",
      status: "PUBLISHED",
      ...(query.search
        ? {
            OR: [
              { title: contains(query.search) },
              { description: contains(query.search) },
            ],
          }
        : {}),
    };
    return prisma.assessment.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        durationMinutes: true,
        totalMarks: true,
        passMarks: true,
        createdAt: true,
        company: { select: { name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },

  async getAssessmentOverview(id: string) {
    const assessment = await prisma.assessment.findFirst({
      where: { id, visibility: "PUBLIC", status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        description: true,
        durationMinutes: true,
        totalMarks: true,
        passMarks: true,
        maxAttempts: true,
        startsAt: true,
        endsAt: true,
        company: { select: { name: true } },
        questions: { select: { type: true } },
      },
    });
    if (!assessment) throw ApiError.notFound("Assessment not found");

    const { questions, ...rest } = assessment;
    const questionCounts = questions.reduce<Record<string, number>>(
      (acc, q) => ({ ...acc, [q.type]: (acc[q.type] ?? 0) + 1 }),
      {},
    );
    return { ...rest, questionCount: questions.length, questionCounts };
  },

  listCompanies(query: PublicSearchQuery) {
    return prisma.company.findMany({
      where: {
        status: "APPROVED",
        ...(query.search
          ? {
              OR: [
                { name: contains(query.search) },
                { description: contains(query.search) },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        website: true,
        logoUrl: true,
        _count: {
          select: {
            jobs: { where: { status: "OPEN" } },
            assessments: {
              where: { status: "PUBLISHED", visibility: "PUBLIC" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    });
  },

  listJobs(query: PublicJobsQuery) {
    const where: Prisma.JobPositionWhereInput = {
      status: "OPEN",
      company: { status: "APPROVED" },
      ...(query.type ? { employmentType: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { title: contains(query.search) },
              { description: contains(query.search) },
              { location: contains(query.search) },
            ],
          }
        : {}),
    };
    return prisma.jobPosition.findMany({
      where,
      include: { company: { select: { id: true, name: true, logoUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },

  listCandidates(query: PublicSearchQuery) {
    const where: Prisma.CandidateProfileWhereInput = {
      user: { status: "ACTIVE" },
      ...(query.search
        ? {
            OR: [
              { headline: contains(query.search) },
              { location: contains(query.search) },
              { skills: { has: query.search } },
              { user: { name: contains(query.search) } },
            ],
          }
        : {}),
    };
    return prisma.candidateProfile.findMany({
      where,
      select: {
        headline: true,
        location: true,
        skills: true,
        portfolioUrl: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      take: 100,
    });
  },

  /** Landing page numbers, always computed from the database. */
  async stats() {
    const [companies, candidates, assessments, jobs, evaluatedResults] =
      await Promise.all([
        prisma.company.count({ where: { status: "APPROVED" } }),
        prisma.user.count({ where: { role: "CANDIDATE", status: "ACTIVE" } }),
        prisma.assessment.count({ where: { status: "PUBLISHED" } }),
        prisma.jobPosition.count({ where: { status: "OPEN" } }),
        prisma.assessmentResult.count({
          where: { status: { in: ["PASSED", "FAILED"] } },
        }),
      ]);
    return {
      companies,
      candidates,
      assessments,
      openJobs: jobs,
      evaluatedResults,
    };
  },

  /** Option lists used by forms so the frontend has no hard-coded enums. */
  meta() {
    return {
      permissions: PERMISSIONS,
      memberRoles: MEMBER_ROLES,
      codingLanguages: CODING_LANGUAGES,
      employmentTypes: EMPLOYMENT_TYPES,
      questionTypes: QUESTION_TYPES,
      assessmentVisibility: ASSESSMENT_VISIBILITY,
    };
  },
};

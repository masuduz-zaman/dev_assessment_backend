import type { Prisma } from "@prisma/client";
import { DEFAULT_PASS_PERCENTAGE } from "../../constants/options";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError";
import { type Actor, isAdmin } from "../../shared/utils/actor";
import type {
  AssessmentListQuery,
  CreateAssessmentInput,
  QuestionInput,
  UpdateAssessmentInput,
} from "./assessments.validation";

const sum = (questions: QuestionInput[]) =>
  questions.reduce((total, q) => total + q.marks, 0);

function questionCreateData(
  q: QuestionInput,
  order: number,
): Prisma.QuestionCreateWithoutAssessmentInput {
  return {
    type: q.type,
    prompt: q.prompt,
    marks: q.marks,
    order,
    explanation: q.explanation,
    ...(q.type === "MCQ"
      ? {
          options: {
            create: (q.options ?? []).map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          },
        }
      : {}),
    ...(q.type === "CODING"
      ? {
          codingConfig: {
            create: {
              starterCode: q.starterCode,
              languageIds: q.languageIds ?? [],
              timeLimitSeconds: q.timeLimitSeconds,
              memoryLimitKb: q.memoryLimitKb,
              testCases: {
                create: (q.testCases ?? []).map((t) => ({
                  input: t.input,
                  expectedOutput: t.expectedOutput,
                  isHidden: t.isHidden,
                  weight: t.weight,
                })),
              },
            },
          },
        }
      : {}),
  };
}

const fullInclude = {
  company: { select: { id: true, name: true } },
  questions: {
    orderBy: { order: "asc" as const },
    include: { options: true, codingConfig: { include: { testCases: true } } },
  },
  _count: { select: { attempts: true, invitations: true } },
};


const candidateInclude = {
  company: { select: { id: true, name: true } },
  questions: {
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      type: true,
      prompt: true,
      marks: true,
      order: true,
      options: { select: { id: true, text: true } },
      codingConfig: {
        select: {
          languageIds: true,
          starterCode: true,
          timeLimitSeconds: true,
          testCases: {
            where: { isHidden: false },
            select: { input: true, expectedOutput: true },
          },
        },
      },
    },
  },
};

/** An assessment the actor may edit: their own company's, or any for super admins. */
async function findManageable(actor: Actor, id: string) {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      ...(isAdmin(actor) ? {} : { companyId: actor.companyId ?? "__none__" }),
    },
  });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  return assessment;
}

export const assessmentsService = {
  list(actor: Actor, query: AssessmentListQuery) {
    const visibleToAll: Prisma.AssessmentWhereInput = {
      visibility: "PUBLIC",
      status: "PUBLISHED",
    };
    let access: Prisma.AssessmentWhereInput;

    if (query.scope === "public") access = visibleToAll;
    else if (query.scope === "mine")
      access = isAdmin(actor)
        ? {}
        : { companyId: actor.companyId ?? "__none__" };
    else
      access = isAdmin(actor)
        ? {}
        : {
            OR: [
              visibleToAll,
              ...(actor.companyId ? [{ companyId: actor.companyId }] : []),
            ],
          };

    const where: Prisma.AssessmentWhereInput = {
      AND: [
        access,
        ...(query.status ? [{ status: query.status }] : []),
        ...(query.search
          ? [
              {
                OR: [
                  {
                    title: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    description: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };

    return prisma.assessment.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        _count: {
          select: { questions: true, attempts: true, invitations: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },

  async getById(actor: Actor, id: string) {
    const meta = await prisma.assessment.findUnique({
      where: { id },
      select: { id: true, companyId: true, status: true, visibility: true },
    });
    if (!meta) throw ApiError.notFound("Assessment not found");

    const canManage =
      isAdmin(actor) ||
      (actor.companyId !== undefined && meta.companyId === actor.companyId);
    if (canManage)
      return prisma.assessment.findUniqueOrThrow({
        where: { id },
        include: fullInclude,
      });

    if (meta.status !== "PUBLISHED")
      throw ApiError.notFound("Assessment not found");
    if (meta.visibility === "PRIVATE") {
      const invitation = await prisma.assessmentInvitation.findFirst({
        where: {
          assessmentId: id,
          candidateId: actor.id,
          acceptedAt: { not: null },
        },
      });
      if (!invitation)
        throw ApiError.forbidden(
          "Accept the private invitation before opening this assessment",
        );
    }
    return prisma.assessment.findUniqueOrThrow({
      where: { id },
      include: candidateInclude,
    });
  },

  async create(actor: Actor, input: CreateAssessmentInput) {
    const totalMarks = sum(input.questions);
    const passMarks =
      input.passMarks ??
      Math.ceil((totalMarks * DEFAULT_PASS_PERCENTAGE) / 100);
    if (passMarks > totalMarks)
      throw ApiError.unprocessable("Validation failed", [
        { field: "passMarks", message: "Pass marks cannot exceed total marks" },
      ]);

    return prisma.assessment.create({
      data: {
        title: input.title,
        description: input.description,
        visibility: input.visibility,
        durationMinutes: input.durationMinutes,
        maxAttempts: input.maxAttempts,
        totalMarks,
        passMarks,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: "DRAFT",
        companyId: actor.companyId ?? null,
        createdById: actor.id,
        questions: { create: input.questions.map(questionCreateData) },
      },
      include: fullInclude,
    });
  },

  async update(actor: Actor, id: string, input: UpdateAssessmentInput) {
    const existing = await findManageable(actor, id);
    const { questions, ...fields } = input;

    if (questions) {
      const attempts = await prisma.assessmentAttempt.count({
        where: { assessmentId: id },
      });
      if (attempts > 0)
        throw ApiError.conflict(
          "Questions cannot be changed after candidates have attempted this assessment",
        );
    }

    const totalMarks = questions ? sum(questions) : existing.totalMarks;
    const passMarks =
      fields.passMarks ??
      (questions
        ? Math.min(existing.passMarks, totalMarks)
        : existing.passMarks);
    if (passMarks > totalMarks)
      throw ApiError.unprocessable("Validation failed", [
        { field: "passMarks", message: "Pass marks cannot exceed total marks" },
      ]);

    await prisma.$transaction(async (tx) => {
      if (questions)
        await tx.question.deleteMany({ where: { assessmentId: id } });
      await tx.assessment.update({
        where: { id },
        data: {
          ...fields,
          totalMarks,
          passMarks,
          ...(questions
            ? { questions: { create: questions.map(questionCreateData) } }
            : {}),
        },
      });
    });

    return prisma.assessment.findUniqueOrThrow({
      where: { id },
      include: fullInclude,
    });
  },

  async remove(actor: Actor, id: string) {
    await findManageable(actor, id);
    const attempts = await prisma.assessmentAttempt.count({
      where: { assessmentId: id },
    });
    if (attempts > 0)
      throw ApiError.conflict(
        "This assessment already has attempts. Archive it instead of deleting",
      );
    await prisma.assessment.delete({ where: { id } });
    return { id, deleted: true };
  },

  async publish(actor: Actor, id: string) {
    await findManageable(actor, id);
    const questions = await prisma.question.count({
      where: { assessmentId: id },
    });
    if (questions === 0)
      throw ApiError.badRequest("Add at least one question before publishing");
    return prisma.assessment.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
  },

  async archive(actor: Actor, id: string) {
    await findManageable(actor, id);
    return prisma.assessment.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  },
};

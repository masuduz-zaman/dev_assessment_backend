import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError";
import { codingService } from "../coding/coding.service";
import { notificationsService } from "../notifications/notifications.service";
import { rankingsService } from "../rankings/rankings.service";
import type { SubmitAttemptInput } from "./attempts.validation";


const SUBMIT_GRACE_MS = 60_000;

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length &&
  [...a].sort().every((value, i) => value === [...b].sort()[i]);

export const attemptsService = {
  async start(candidateId: string, assessmentId: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment || assessment.status !== "PUBLISHED")
      throw ApiError.notFound("Assessment is not available");

    const now = new Date();
    if (
      (assessment.startsAt && assessment.startsAt > now) ||
      (assessment.endsAt && assessment.endsAt < now)
    ) {
      throw ApiError.badRequest("This assessment is outside its active window");
    }

    if (assessment.visibility === "PRIVATE") {
      const invitation = await prisma.assessmentInvitation.findFirst({
        where: { assessmentId, candidateId, acceptedAt: { not: null } },
      });
      if (!invitation)
        throw ApiError.forbidden(
          "Accept the private invitation before starting this assessment",
        );
    }

    // Resume an attempt that is still running instead of burning another attempt.
    const running = await prisma.assessmentAttempt.findFirst({
      where: { assessmentId, candidateId, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
    });
    if (running) {
      if (running.deadlineAt.getTime() + SUBMIT_GRACE_MS > now.getTime())
        return { attempt: running, resumed: true };
      await prisma.assessmentAttempt.update({
        where: { id: running.id },
        data: { status: "EXPIRED" },
      });
    }

    const used = await prisma.assessmentAttempt.count({
      where: { assessmentId, candidateId },
    });
    if (used >= assessment.maxAttempts)
      throw ApiError.badRequest(
        "You have used all attempts for this assessment",
      );

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        candidateId,
        deadlineAt: new Date(
          now.getTime() + assessment.durationMinutes * 60_000,
        ),
      },
    });
    return { attempt, resumed: false };
  },

  async submit(
    candidateId: string,
    attemptId: string,
    input: SubmitAttemptInput,
  ) {
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, candidateId, status: "IN_PROGRESS" },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                options: true,
                codingConfig: { include: { testCases: true } },
              },
            },
          },
        },
      },
    });
    if (!attempt) throw ApiError.notFound("Active attempt not found");
    if (attempt.deadlineAt.getTime() + SUBMIT_GRACE_MS < Date.now()) {
      await prisma.assessmentAttempt.update({
        where: { id: attempt.id },
        data: { status: "EXPIRED" },
      });
      throw ApiError.badRequest("The time limit for this attempt has expired");
    }

    const { assessment } = attempt;
    const now = new Date();
    let autoScore = 0;
    let needsManualReview = assessment.questions.some(
      (q) => q.type === "WRITTEN",
    );
    const writes: Prisma.PrismaPromise<unknown>[] = [];

    for (const answer of input.answers) {
      const question = assessment.questions.find(
        (q) => q.id === answer.questionId,
      );
      if (!question) continue;

      let marks = 0;
      let autoGraded = false;
      let executionResult: Prisma.InputJsonValue | undefined;

      if (question.type === "MCQ") {
        autoGraded = true;
        const correct = question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id);
        if (
          answer.selectedOptionIds.length > 0 &&
          sameSet(correct, answer.selectedOptionIds)
        )
          marks = question.marks;
      }

      if (question.type === "CODING") {
        const config = question.codingConfig;
        if (
          answer.code &&
          answer.languageId &&
          config &&
          config.testCases.length > 0
        ) {
          try {
            let passedWeight = 0;
            for (const test of config.testCases) {
              const run = await codingService.execute({
                source_code: answer.code,
                language_id: answer.languageId,
                stdin: test.input,
                time_limit: config.timeLimitSeconds,
                memory_limit: config.memoryLimitKb,
              });
              if (
                String(run.stdout ?? "").trim() === test.expectedOutput.trim()
              )
                passedWeight += test.weight;
            }
            const totalWeight = config.testCases.reduce(
              (sum, t) => sum + t.weight,
              0,
            );
            marks = totalWeight
              ? Math.round(
                  ((question.marks * passedWeight) / totalWeight) * 100,
                ) / 100
              : 0;
            executionResult = { passedWeight, totalWeight };
            autoGraded = true;
          } catch {
            executionResult = {
              error:
                "Automatic execution was unavailable. Awaiting manual review.",
            };
            needsManualReview = true;
          }
        } else {
          autoGraded = true;
        }
      }

      autoScore += marks;
      const data = {
        selectedOptionIds: answer.selectedOptionIds,
        answerText: answer.answerText,
        code: answer.code,
        languageId: answer.languageId,
        executionResult,
        marksAwarded: marks,
        evaluatedAt: autoGraded ? now : null,
      };
      writes.push(
        prisma.submission.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: question.id,
            },
          },
          create: { attemptId: attempt.id, questionId: question.id, ...data },
          update: data,
        }),
      );
    }

    const percentage = assessment.totalMarks
      ? (autoScore / assessment.totalMarks) * 100
      : 0;
    const status = needsManualReview
      ? "PENDING"
      : autoScore >= assessment.passMarks
        ? "PASSED"
        : "FAILED";


    const outcomes = await prisma.$transaction([
      ...writes,
      prisma.assessmentResult.create({
        data: {
          attemptId: attempt.id,
          assessmentId: assessment.id,
          candidateId,
          obtainedMarks: autoScore,
          totalMarks: assessment.totalMarks,
          percentage,
          status,
          evaluatedAt: needsManualReview ? null : now,
        },
      }),
      prisma.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: needsManualReview ? "SUBMITTED" : "EVALUATED",
          submittedAt: now,
        },
      }),
    ]);
    const result = outcomes[
      writes.length
    ] as Prisma.AssessmentResultGetPayload<object>;

    if (needsManualReview) {
      if (assessment.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: assessment.companyId },
          select: { ownerId: true },
        });
        if (company)
          await notificationsService.notify(
            company.ownerId,
            "New submission to review",
            `A candidate submitted "${assessment.title}" and it needs manual review.`,
          );
      }
    } else {
      await rankingsService.recalculateFor(candidateId, assessment);
      await notificationsService.notify(
        candidateId,
        "Result available",
        `You scored ${Math.round(percentage)}% on "${assessment.title}" (${status.toLowerCase()}).`,
      );
    }

    return { result, manualReviewPending: needsManualReview };
  },
};

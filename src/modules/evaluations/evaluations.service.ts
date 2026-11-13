import { prisma } from "../../config/prisma";
import { ApiError } from "../../shared/errors/apiError.js";
import { type Actor, isAdmin } from "../../shared/utils/actor";
import { notificationsService } from "../notifications/notifications.service";
import { rankingsService } from "../rankings/rankings.service";
import type { EvaluateInput } from "./evaluations.validation";

const companyFilter = (actor: Actor) =>
  isAdmin(actor) ? {} : { companyId: actor.companyId ?? "__none__" };

export const evaluationsService = {
  pending(actor: Actor) {
    return prisma.submission.findMany({
      where: {
        evaluatedAt: null,
        question: { type: { in: ["WRITTEN", "CODING"] } },
        attempt: { status: "SUBMITTED", assessment: companyFilter(actor) },
      },
      include: {
        question: {
          select: { id: true, type: true, prompt: true, marks: true },
        },
        attempt: {
          select: {
            id: true,
            submittedAt: true,
            candidate: { select: { id: true, name: true, email: true } },
            assessment: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { attemptId: "asc" },
      take: 100,
    });
  },

  async evaluate(actor: Actor, submissionId: string, input: EvaluateInput) {
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        attempt: { assessment: companyFilter(actor) },
      },
      include: { question: true, attempt: { include: { assessment: true } } },
    });
    if (!submission) throw ApiError.notFound("Submission not found");
    if (input.marksAwarded > submission.question.marks) {
      throw ApiError.unprocessable("Validation failed", [
        {
          field: "marksAwarded",
          message: `Marks cannot exceed ${submission.question.marks}`,
        },
      ]);
    }

    const { assessment } = submission.attempt;
    const now = new Date();

    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        marksAwarded: input.marksAwarded,
        feedback: input.feedback,
        evaluatedAt: now,
        evaluatorId: actor.id,
      },
    });

    const all = await prisma.submission.findMany({
      where: { attemptId: submission.attemptId },
    });
    const score = all.reduce((sum, s) => sum + s.marksAwarded, 0);
    const stillPending = all.some((s) => s.evaluatedAt === null);
    const percentage = assessment.totalMarks
      ? (score / assessment.totalMarks) * 100
      : 0;

    if (stillPending) {
      return prisma.assessmentResult.update({
        where: { attemptId: submission.attemptId },
        data: { obtainedMarks: score, percentage },
      });
    }

    const result = await prisma.assessmentResult.update({
      where: { attemptId: submission.attemptId },
      data: {
        obtainedMarks: score,
        percentage,
        status: score >= assessment.passMarks ? "PASSED" : "FAILED",
        evaluatedAt: now,
      },
    });
    await prisma.assessmentAttempt.update({
      where: { id: submission.attemptId },
      data: { status: "EVALUATED" },
    });
    await rankingsService.recalculateFor(result.candidateId, assessment);
    await notificationsService.notify(
      result.candidateId,
      "Your result is ready",
      `"${assessment.title}" has been evaluated: ${Math.round(percentage)}% (${result.status.toLowerCase()}).`,
    );
    return result;
  },
};

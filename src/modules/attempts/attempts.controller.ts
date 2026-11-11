import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { attemptsService } from "./attempts.service";

export const attemptsController = {
  start: asyncHandler(async (req, res) => {
    const { attempt, resumed } = await attemptsService.start(
      req.user!.id,
      req.body.assessmentId,
    );
    if (resumed)
      return sendSuccess(res, attempt, "Resumed your attempt in progress");
    sendCreated(res, attempt, "Attempt started. Good luck!");
  }),
  submit: asyncHandler(async (req, res) => {
    const outcome = await attemptsService.submit(
      req.user!.id,
      req.params.id,
      req.body,
    );
    const message = outcome.manualReviewPending
      ? "Submission received. Some answers need manual review"
      : "Submission received and graded";
    sendCreated(res, outcome, message);
  }),
};

import { asyncHandler } from "../../shared/utils/asyncHandler";
import { actorFrom } from "../../shared/utils/actor";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { evaluationsService } from "./evaluations.service";

export const evaluationsController = {
  pending: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await evaluationsService.pending(actorFrom(req)),
      "Pending submissions fetched successfully",
    );
  }),
  evaluate: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await evaluationsService.evaluate(
        actorFrom(req),
        req.params.submissionId,
        req.body,
      ),
      "Submission evaluated successfully",
    );
  }),
};

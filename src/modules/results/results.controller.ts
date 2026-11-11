import { asyncHandler } from "../../shared/utils/asyncHandler";
import { actorFrom } from "../../shared/utils/actor";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { resultsService } from "./results.service";

export const resultsController = {
  listMine: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await resultsService.listMine(req.user!.id),
      "Results fetched successfully",
    );
  }),
  listForCompany: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await resultsService.listForCompany(actorFrom(req)),
      "Candidate results fetched successfully",
    );
  }),
};

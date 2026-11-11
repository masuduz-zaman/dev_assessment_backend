import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { plansService } from "./plans.service";

export const plansController = {
  list: asyncHandler(async (_req, res) => {
    sendSuccess(
      res,
      await plansService.listActive(),
      "Plans fetched successfully",
    );
  }),
  listAll: asyncHandler(async (_req, res) => {
    sendSuccess(
      res,
      await plansService.listAll(),
      "Plans fetched successfully",
    );
  }),
  create: asyncHandler(async (req, res) => {
    sendCreated(
      res,
      await plansService.create(req.body),
      "Plan created successfully",
    );
  }),
  update: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await plansService.update(req.params.id, req.body),
      "Plan updated successfully",
    );
  }),
};

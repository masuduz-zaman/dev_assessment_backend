import { asyncHandler } from "../../shared/utils/asyncHandler";
import { requireCompanyId } from "../../shared/middlewares/authorize.middleware";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { teamService } from "./team.service";

const actor = (req: Parameters<Parameters<typeof asyncHandler>[0]>[0]) => ({
  companyId: requireCompanyId(req.companyId),
  permissions: req.permissions ?? [],
});

export const teamController = {
  list: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await teamService.list(requireCompanyId(req.companyId)),
      "Team members fetched successfully",
    );
  }),
  add: asyncHandler(async (req, res) => {
    sendCreated(
      res,
      await teamService.add(actor(req), req.body),
      "Team member added successfully",
    );
  }),
  update: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await teamService.update(actor(req), req.params.id, req.body),
      "Team member updated successfully",
    );
  }),
  remove: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await teamService.remove(actor(req), req.params.id),
      "Team member removed successfully",
    );
  }),
};

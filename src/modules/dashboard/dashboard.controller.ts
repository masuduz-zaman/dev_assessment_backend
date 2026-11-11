import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  get: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await dashboardService.forUser(req.user!, req.companyId),
      "Dashboard fetched successfully",
    );
  }),
};

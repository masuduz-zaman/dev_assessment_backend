import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { rankingsService } from "./rankings.service";

export const rankingsController = {
  list: asyncHandler(async (req, res) => {
    const { scope } = req.query as unknown as { scope: "public" | "company" };
    sendSuccess(
      res,
      await rankingsService.list(scope, req.companyId),
      "Rankings fetched successfully",
    );
  }),
};

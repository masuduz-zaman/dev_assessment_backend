import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { codingService } from "./coding.service";

export const codingController = {
  execute: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await codingService.execute(req.body),
      "Code executed successfully",
    );
  }),
};

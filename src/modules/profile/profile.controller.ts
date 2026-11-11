import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { profileService } from "./profile.service";

export const profileController = {
  get: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await profileService.get(req.user!.id),
      "Profile fetched successfully",
    );
  }),
  update: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await profileService.update(req.user!, req.body),
      "Profile updated successfully",
    );
  }),
};

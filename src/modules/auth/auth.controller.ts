import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { authService } from "./auth.service";

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    const message = result.requiresApproval
      ? "Company registered. You can sign in once a Super Admin approves it"
      : "Account created successfully";
    sendCreated(res, result, message);
  }),

  login: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await authService.login(req.body),
      "Signed in successfully",
    );
  }),

  google: asyncHandler(async (req, res) => {
    const result = await authService.loginWithGoogle(req.body);
    if (result.requiresApproval) {
      return sendCreated(
        res,
        result,
        "Company registered with Google. You can sign in once a Super Admin approves it",
      );
    }
    sendSuccess(
      res,
      result,
      result.created ? "Account created with Google" : "Signed in with Google",
    );
  }),

  me: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await authService.me(req.user!.id),
      "Current user fetched successfully",
    );
  }),


  googleConfig: asyncHandler(async (_req, res) => {
    sendSuccess(
      res,
      authService.googleConfig(),
      "Google sign-in configuration fetched successfully",
    );
  }),
};

import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth.middleware";
import { authLimiter } from "../../shared/middlewares/rateLimit.middleware";
import { validate } from "../../shared/middlewares/validate.middleware";
import { authController } from "./auth.controller";
import { googleLoginBody, loginBody, registerBody } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate({ body: registerBody }),
  authController.register,
);
router.post(
  "/login",
  authLimiter,
  validate({ body: loginBody }),
  authController.login,
);
router.post(
  "/google",
  authLimiter,
  validate({ body: googleLoginBody }),
  authController.google,
);
router.get("/google/config", authController.googleConfig);
router.get("/me", authenticate, authController.me);

export default router;

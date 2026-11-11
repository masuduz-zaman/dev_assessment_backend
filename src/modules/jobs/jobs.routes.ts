import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../shared/middlewares/authorize.middleware";
import { validate } from "../../shared/middlewares/validate.middleware";
import { jobsController } from "./jobs.controller";
import { createJobBody, jobIdParams, updateJobBody } from "./jobs.validation";

// Open jobs for visitors are served by GET /api/public/jobs. These routes manage a company's own postings.
const router = Router();
router.use(authenticate, requirePermission("recruitment:manage"));

router.get("/mine", jobsController.listMine);
router.post("/", validate({ body: createJobBody }), jobsController.create);
router.patch(
  "/:id",
  validate({ params: jobIdParams, body: updateJobBody }),
  jobsController.update,
);
router.delete("/:id", validate({ params: jobIdParams }), jobsController.remove);

export default router;

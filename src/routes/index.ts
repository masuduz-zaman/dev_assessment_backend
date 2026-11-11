import { Router } from "express";
import adminRoutes from "../modules/admin/admin.routes";
import applicationsRoutes from "../modules/applications/applications.routes";
import assessmentsRoutes from "../modules/assessments/assessments.routes";
import attemptsRoutes from "../modules/attempts/attempts.routes";
import authRoutes from "../modules/auth/auth.routes";
import codingRoutes from "../modules/coding/coding.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import evaluationsRoutes from "../modules/evaluations/evaluations.routes";
import invitationsRoutes from "../modules/invitations/invitations.routes";
import jobsRoutes from "../modules/jobs/jobs.routes";
import notificationsRoutes from "../modules/notifications/notifications.routes";
import offersRoutes from "../modules/offers/offers.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import plansRoutes from "../modules/plans/plans.routes";
import profileRoutes from "../modules/profile/profile.routes";
import publicRoutes from "../modules/public/public.routes";
import rankingsRoutes from "../modules/rankings/rankings.routes";
import resultsRoutes from "../modules/results/results.routes";
import teamRoutes from "../modules/team/team.routes";
import { sendSuccess } from "../shared/utils/apiResponse";

const router = Router();

router.get("/health", (_req, res) =>
  sendSuccess(
    res,
    { status: "ok", service: "assessment-api", uptime: process.uptime() },
    "API is healthy",
  ),
);

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/profile", profileRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);
router.use("/company/members", teamRoutes);
router.use("/assessments", assessmentsRoutes);
router.use("/invitations", invitationsRoutes);
router.use("/attempts", attemptsRoutes);
router.use("/evaluations", evaluationsRoutes);
router.use("/results", resultsRoutes);
router.use("/coding", codingRoutes);
router.use("/rankings", rankingsRoutes);
router.use("/jobs", jobsRoutes);
router.use("/applications", applicationsRoutes);
router.use("/offers", offersRoutes);
router.use("/plans", plansRoutes);
router.use("/payments", paymentsRoutes);
router.use("/notifications", notificationsRoutes);

export default router;

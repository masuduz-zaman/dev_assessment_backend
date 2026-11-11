import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { publicService } from "./public.service";

export const publicController = {
  assessments: asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await publicService.listAssessments(req.query),
      "Assessments fetched successfully",
    ),
  ),
  assessmentOverview: asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await publicService.getAssessmentOverview(req.params.id),
      "Assessment fetched successfully",
    ),
  ),
  companies: asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await publicService.listCompanies(req.query),
      "Companies fetched successfully",
    ),
  ),
  jobs: asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await publicService.listJobs(req.query),
      "Jobs fetched successfully",
    ),
  ),
  candidates: asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await publicService.listCandidates(req.query),
      "Candidates fetched successfully",
    ),
  ),
  stats: asyncHandler(async (_req, res) =>
    sendSuccess(
      res,
      await publicService.stats(),
      "Platform statistics fetched successfully",
    ),
  ),
  meta: asyncHandler(async (_req, res) =>
    sendSuccess(res, publicService.meta(), "Metadata fetched successfully"),
  ),
};

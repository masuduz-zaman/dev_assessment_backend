import { asyncHandler } from "../../shared/utils/asyncHandler";
import { requireCompanyId } from "../../shared/middlewares/authorize.middleware";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { jobsService } from "./jobs.service";

export const jobsController = {
  listMine: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await jobsService.listForCompany(requireCompanyId(req.companyId)),
      "Jobs fetched successfully",
    );
  }),
  create: asyncHandler(async (req, res) => {
    sendCreated(
      res,
      await jobsService.create(requireCompanyId(req.companyId), req.body),
      "Job created successfully",
    );
  }),
  update: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await jobsService.update(
        requireCompanyId(req.companyId),
        req.params.id,
        req.body,
      ),
      "Job updated successfully",
    );
  }),
  remove: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await jobsService.remove(requireCompanyId(req.companyId), req.params.id),
      "Job deleted successfully",
    );
  }),
};

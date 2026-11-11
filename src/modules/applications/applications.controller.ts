import { asyncHandler } from "../../shared/utils/asyncHandler";
import { requireCompanyId } from "../../shared/middlewares/authorize.middleware";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { applicationsService } from "./applications.service";

export const applicationsController = {
  apply: asyncHandler(async (req, res) => {
    sendCreated(
      res,
      await applicationsService.apply(req.user!.id, req.body),
      "Application submitted successfully",
    );
  }),
  listMine: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await applicationsService.listMine(req.user!.id),
      "Applications fetched successfully",
    );
  }),
  listForCompany: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await applicationsService.listForCompany(
        requireCompanyId(req.companyId),
        req.query,
      ),
      "Applications fetched successfully",
    );
  }),
  updateStatus: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await applicationsService.updateStatus(
        requireCompanyId(req.companyId),
        req.params.id,
        req.body.status,
      ),
      "Application status updated successfully",
    );
  }),
};

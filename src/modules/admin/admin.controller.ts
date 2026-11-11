import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { adminService } from "./admin.service";

export const adminController = {
  listCompanies: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await adminService.listCompanies(req.query),
      "Companies fetched successfully",
    );
  }),
  updateCompanyStatus: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await adminService.updateCompanyStatus(
        req.user!.id,
        req.params.id,
        req.body,
      ),
      "Company status updated successfully",
    );
  }),
  listUsers: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await adminService.listUsers(req.query),
      "Users fetched successfully",
    );
  }),
  updateUserStatus: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await adminService.updateUserStatus(
        req.user!.id,
        req.params.id,
        req.body.status,
      ),
      "User status updated successfully",
    );
  }),
  listAssessments: asyncHandler(async (_req, res) => {
    sendSuccess(
      res,
      await adminService.listAssessments(),
      "Assessments fetched successfully",
    );
  }),
  listPayments: asyncHandler(async (_req, res) => {
    sendSuccess(
      res,
      await adminService.listPayments(),
      "Payments fetched successfully",
    );
  }),
  auditLogs: asyncHandler(async (_req, res) => {
    sendSuccess(
      res,
      await adminService.auditLogs(),
      "Audit logs fetched successfully",
    );
  }),
  reports: asyncHandler(async (_req, res) => {
    sendSuccess(
      res,
      await adminService.reports(),
      "Reports generated successfully",
    );
  }),
};

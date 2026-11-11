import { asyncHandler } from "../../shared/utils/asyncHandler";
import { requireCompanyId } from "../../shared/middlewares/authorize.middleware";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { offersService } from "./offers.service";

export const offersController = {
  create: asyncHandler(async (req, res) => {
    sendCreated(
      res,
      await offersService.create(
        requireCompanyId(req.companyId),
        req.user!.id,
        req.body,
      ),
      "Offer sent successfully",
    );
  }),
  listMine: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await offersService.listMine(req.user!.id),
      "Offers fetched successfully",
    );
  }),
  listForCompany: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await offersService.listForCompany(requireCompanyId(req.companyId)),
      "Offers fetched successfully",
    );
  }),
  respond: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await offersService.respond(req.user!.id, req.params.id, req.body.status),
      "Offer response recorded",
    );
  }),
};

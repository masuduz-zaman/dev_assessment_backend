import { asyncHandler } from "../../shared/utils/asyncHandler";
import { actorFrom } from "../../shared/utils/actor";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { invitationsService } from "./invitations.service";

export const invitationsController = {
  create: asyncHandler(async (req, res) => {
    sendCreated(
      res,
      await invitationsService.create(actorFrom(req), req.body),
      "Invitations sent successfully",
    );
  }),
  listMine: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await invitationsService.listMine(req.user!.id),
      "Invitations fetched successfully",
    );
  }),
  listForAssessment: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await invitationsService.listForAssessment(
        actorFrom(req),
        req.params.assessmentId,
      ),
      "Invitations fetched successfully",
    );
  }),
  accept: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await invitationsService.accept(req.user!.id, req.params.id),
      "Invitation accepted successfully",
    );
  }),
};

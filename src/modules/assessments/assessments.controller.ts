import { asyncHandler } from "../../shared/utils/asyncHandler";
import { actorFrom } from "../../shared/utils/actor";
import { sendCreated, sendSuccess } from "../../shared/utils/apiResponse";
import { assessmentsService } from "./assessments.service";

export const assessmentsController = {
  list: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await assessmentsService.list(actorFrom(req), req.query),
      "Assessments fetched successfully",
    );
  }),
  getById: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await assessmentsService.getById(actorFrom(req), req.params.id),
      "Assessment fetched successfully",
    );
  }),
  create: asyncHandler(async (req, res) => {
    sendCreated(
      res,
      await assessmentsService.create(actorFrom(req), req.body),
      "Assessment created as draft",
    );
  }),
  update: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await assessmentsService.update(actorFrom(req), req.params.id, req.body),
      "Assessment updated successfully",
    );
  }),
  remove: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await assessmentsService.remove(actorFrom(req), req.params.id),
      "Assessment deleted successfully",
    );
  }),
  publish: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await assessmentsService.publish(actorFrom(req), req.params.id),
      "Assessment published successfully",
    );
  }),
  archive: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await assessmentsService.archive(actorFrom(req), req.params.id),
      "Assessment archived successfully",
    );
  }),
};

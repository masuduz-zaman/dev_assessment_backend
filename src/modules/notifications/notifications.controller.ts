import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  list: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await notificationsService.list(req.user!.id),
      "Notifications fetched successfully",
    );
  }),
  markRead: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await notificationsService.markRead(req.user!.id, req.params.id),
      "Notification marked as read",
    );
  }),
  markAllRead: asyncHandler(async (req, res) => {
    sendSuccess(
      res,
      await notificationsService.markAllRead(req.user!.id),
      "All notifications marked as read",
    );
  }),
};

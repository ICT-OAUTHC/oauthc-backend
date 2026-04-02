import { Response } from "express";
import Notification from "../models/Notification";
import { AuthRequest, PaginationQuery } from "../types";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { getPaginationOptions } from "../utils/pagination";

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query as PaginationQuery;
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = { user: req.user!._id };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort(sort).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    res.status(200).json({
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount },
    });
  } catch (error) {
    sendError(res, "Failed to fetch notifications", 500);
  }
};

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { read: true },
      { new: true }
    );
    if (!notification) { sendError(res, "Notification not found", 404); return; }
    sendSuccess(res, notification);
  } catch (error) {
    sendError(res, "Failed to mark notification", 500);
  }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ user: req.user!._id, read: false }, { read: true });
    sendSuccess(res, { message: "All notifications marked as read" });
  } catch (error) {
    sendError(res, "Failed to mark notifications", 500);
  }
};

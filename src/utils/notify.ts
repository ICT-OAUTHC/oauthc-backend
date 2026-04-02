import Notification from "../models/Notification";
import User from "../models/User";
import { getIO } from "../socket";

/**
 * Create a notification for all active admin + staff users
 * and push it via WebSocket in real time.
 */
export async function notifyAdminStaff(title: string, message: string) {
  try {
    const users = await User.find({ role: { $in: ["admin", "staff"] }, status: "active" }).select("_id");
    if (users.length === 0) return;

    const docs = users.map((u) => ({ user: u._id, title, message }));
    const notifications = await Notification.insertMany(docs);

    const io = getIO();
    if (io) {
      notifications.forEach((n) => {
        io.to(`user:${n.user.toString()}`).emit("notification", n.toJSON());
      });
    }
  } catch {
    // Non-critical — don't block the main operation
  }
}

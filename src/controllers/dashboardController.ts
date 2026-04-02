import { Response } from "express";
import Appointment from "../models/Appointment";
import User from "../models/User";
import Contact from "../models/Contact";
import Newsletter from "../models/Newsletter";
import ResearchEthics from "../models/ResearchEthics";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/apiResponse";

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const userId = req.user?._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    if (role === "doctor") {
      const [myToday, myTotal, myPending] = await Promise.all([
        Appointment.countDocuments({ doctorId: userId, date: todayStr }),
        Appointment.countDocuments({ doctorId: userId }),
        Appointment.countDocuments({ doctorId: userId, status: "pending" }),
      ]);

      sendSuccess(res, {
        myAppointmentsToday: myToday,
        totalAppointments: myTotal,
        pendingAppointments: myPending,
      });
      return;
    }

    // Admin / Staff
    const [
      todayAppointments,
      activeDoctors,
      totalUsers,
      pendingUsers,
      unreadContacts,
      totalContacts,
      activeSubscribers,
      totalSubscribers,
      pendingEthics,
      totalEthics,
      pendingAppointments,
    ] = await Promise.all([
      Appointment.countDocuments({ date: todayStr }),
      User.countDocuments({ role: "doctor", status: "active" }),
      User.countDocuments(),
      User.countDocuments({ status: "pending" }),
      Contact.countDocuments({ status: "unread" }),
      Contact.countDocuments(),
      Newsletter.countDocuments({ status: "active" }),
      Newsletter.countDocuments(),
      ResearchEthics.countDocuments({ status: "received" }),
      ResearchEthics.countDocuments(),
      Appointment.countDocuments({ status: "pending" }),
    ]);

    sendSuccess(res, {
      todayAppointments,
      activeDoctors,
      totalUsers,
      pendingUsers,
      unreadContacts,
      totalContacts,
      activeSubscribers,
      totalSubscribers,
      pendingEthics,
      totalEthics,
      pendingAppointments,
    });
  } catch (error) {
    sendError(res, "Failed to fetch dashboard stats", 500);
  }
};

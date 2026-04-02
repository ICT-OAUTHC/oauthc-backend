import { Request, Response } from "express";
import Appointment from "../models/Appointment";
import { AuthRequest, PaginationQuery } from "../types";
import { sendSuccess, sendPaginated, sendError } from "../utils/apiResponse";
import { getPaginationOptions } from "../utils/pagination";
import { notifyAdminStaff } from "../utils/notify";
import {
  sendAppointmentBooked,
  sendAppointmentConfirmed,
  sendAppointmentCancelled,
  sendAppointmentRescheduled,
  sendDoctorAssigned,
} from "../utils/email";

export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query as PaginationQuery;
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if ((req.query as any).doctorId) filter.doctorId = (req.query as any).doctorId;
    if ((req.query as any).department) filter.department = (req.query as any).department;
    if (query.search) {
      filter.$or = [
        { patient: { $regex: query.search, $options: "i" } },
        { department: { $regex: query.search, $options: "i" } },
      ];
    }

    // Doctors can only see their own appointments
    if (req.user!.role === "doctor") {
      filter.doctorId = req.user!._id;
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter).sort(sort).skip(skip).limit(limit),
      Appointment.countDocuments(filter),
    ]);

    sendPaginated(res, appointments, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    sendError(res, "Failed to fetch appointments", 500);
  }
};

export const getAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) { sendError(res, "Appointment not found", 404); return; }
    sendSuccess(res, appointment);
  } catch (error) {
    sendError(res, "Failed to fetch appointment", 500);
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.create(req.body);

    // Notify admin/staff about the new booking
    notifyAdminStaff(
      "New appointment request",
      `${appointment.patient} requested an appointment for ${appointment.date} at ${appointment.time}.`
    );

    // Email patient
    if (appointment.patientEmail) {
      sendAppointmentBooked(appointment.patientEmail, {
        patient: appointment.patient,
        date: appointment.date,
        time: appointment.time,
        department: appointment.department,
      });
    }

    sendSuccess(res, appointment, 201);
  } catch (error) {
    sendError(res, "Failed to create appointment", 500);
  }
};

export const confirmAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "confirmed" },
      { new: true }
    );
    if (!appointment) { sendError(res, "Appointment not found", 404); return; }

    if (appointment.patientEmail) {
      sendAppointmentConfirmed(appointment.patientEmail, {
        patient: appointment.patient,
        date: appointment.date,
        time: appointment.time,
        department: appointment.department,
        doctor: appointment.doctor,
      });
    }

    sendSuccess(res, appointment);
  } catch (error) {
    sendError(res, "Failed to confirm appointment", 500);
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason) { sendError(res, "Cancellation reason is required", 400); return; }

    const cancelledBy = req.user?.name || req.user?.email || "Admin";
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled", cancelReason: reason, cancelledBy, rescheduleReason: "", rescheduledBy: "" },
      { new: true }
    );
    if (!appointment) { sendError(res, "Appointment not found", 404); return; }

    if (appointment.patientEmail) {
      sendAppointmentCancelled(appointment.patientEmail, {
        patient: appointment.patient,
        date: appointment.date,
        time: appointment.time,
        reason,
        cancelledBy,
      });
    }

    sendSuccess(res, appointment);
  } catch (error) {
    sendError(res, "Failed to cancel appointment", 500);
  }
};

export const rescheduleAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, time, reason } = req.body;
    if (!date || !time || !reason) {
      sendError(res, "Date, time, and reason are required", 400);
      return;
    }

    const rescheduledBy = req.user?.name || req.user?.email || "Admin";
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "rescheduled", date, time, rescheduleReason: reason, rescheduledBy, cancelReason: "", cancelledBy: "" },
      { new: true }
    );
    if (!appointment) { sendError(res, "Appointment not found", 404); return; }

    if (appointment.patientEmail) {
      sendAppointmentRescheduled(appointment.patientEmail, {
        patient: appointment.patient,
        newDate: date,
        newTime: time,
        reason,
        rescheduledBy,
      });
    }

    sendSuccess(res, appointment);
  } catch (error) {
    sendError(res, "Failed to reschedule appointment", 500);
  }
};

export const assignAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, doctor, department, notes } = req.body;
    if (!doctorId || !department) {
      sendError(res, "Doctor and department are required", 400);
      return;
    }

    const existing = await Appointment.findById(req.params.id);
    if (!existing) { sendError(res, "Appointment not found", 404); return; }

    if (existing.doctorId && !notes) {
      sendError(res, "Notes are required when reassigning", 400);
      return;
    }

    const isReassignment = !!existing.doctorId;
    const updates: Record<string, any> = { doctorId, department, status: "confirmed" };
    if (doctor) updates.doctor = doctor;
    if (notes) updates.assignNotes = notes;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (appointment?.patientEmail) {
      sendDoctorAssigned(appointment.patientEmail, {
        patient: appointment.patient,
        date: appointment.date,
        time: appointment.time,
        doctor: doctor || "Your assigned doctor",
        department,
        isReassignment,
        notes,
      });
    }

    sendSuccess(res, appointment);
  } catch (error) {
    sendError(res, "Failed to assign appointment", 500);
  }
};

export const deleteAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) { sendError(res, "Appointment not found", 404); return; }
    sendSuccess(res, { message: "Appointment deleted" });
  } catch (error) {
    sendError(res, "Failed to delete appointment", 500);
  }
};

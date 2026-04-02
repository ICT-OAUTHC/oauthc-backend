import { Router } from "express";
import {
  getAppointments, getAppointment, createAppointment,
  confirmAppointment, cancelAppointment, rescheduleAppointment,
  assignAppointment, deleteAppointment,
} from "../controllers/appointmentController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// Public
router.post("/", createAppointment);

// Protected
router.get("/", protect, getAppointments);
router.get("/:id", protect, getAppointment);
router.patch("/:id/confirm", protect, authorize("admin", "staff"), confirmAppointment);
router.patch("/:id/cancel", protect, authorize("admin", "staff"), cancelAppointment);
router.patch("/:id/reschedule", protect, authorize("admin", "staff"), rescheduleAppointment);
router.patch("/:id/assign", protect, authorize("admin", "staff"), assignAppointment);
router.delete("/:id", protect, authorize("admin"), deleteAppointment);

export default router;

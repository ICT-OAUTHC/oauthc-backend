import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAppointment extends Document {
  patient: string;
  patientPhone?: string;
  patientEmail?: string;
  patientType: "new" | "returning" | "referred";
  gender: "male" | "female";
  referralNote?: string;
  date: string;
  time: string;
  department: string;
  doctor?: string;
  doctorId?: Types.ObjectId;
  status: "pending" | "confirmed" | "cancelled" | "rescheduled";
  notes?: string;
  cancelReason?: string;
  cancelledBy?: string;
  rescheduleReason?: string;
  rescheduledBy?: string;
  assignNotes?: string;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: String, required: true },
    patientPhone: { type: String },
    patientEmail: { type: String },
    patientType: { type: String, enum: ["new", "returning", "referred"], required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    referralNote: { type: String },
    date: { type: String, required: true },
    time: { type: String, required: true },
    department: { type: String, default: "" },
    doctor: { type: String },
    doctorId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "rescheduled"],
      default: "pending",
    },
    notes: { type: String },
    cancelReason: { type: String },
    cancelledBy: { type: String },
    rescheduleReason: { type: String },
    rescheduledBy: { type: String },
    assignNotes: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IAppointment>("Appointment", appointmentSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  slug: string;
  image: string;
  gender: "male" | "female";
  specialty: string;
  department: string;
  center: string;
  yearsOfExperience: number;
  languages: string[];
  qualifications: string[];
  bio: string[];
  expertise: string[];
  education: { degree: string; institution: string; year: string }[];
  social: { linkedin?: string; facebook?: string; instagram?: string };
  email: string;
  phone: string;
  status: "active" | "on-leave" | "inactive";
  available: boolean;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female"], required: true },
    specialty: { type: String, required: true },
    department: { type: String, required: true },
    center: { type: String, default: "" },
    yearsOfExperience: { type: Number, default: 0 },
    languages: [{ type: String }],
    qualifications: [{ type: String }],
    bio: [{ type: String }],
    expertise: [{ type: String }],
    education: [
      {
        degree: { type: String },
        institution: { type: String },
        year: { type: String },
      },
    ],
    social: {
      linkedin: { type: String },
      facebook: { type: String },
      instagram: { type: String },
    },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    status: { type: String, enum: ["active", "on-leave", "inactive"], default: "active" },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IDoctor>("Doctor", doctorSchema);

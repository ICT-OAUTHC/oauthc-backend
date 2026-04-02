import mongoose, { Schema, Document } from "mongoose";

export interface ISchool extends Document {
  name: string;
  slug: string;
  image: string;
  tagline: string;
  overview: string[];
  programmes: { name: string; duration: string; details: string }[];
  facilities: { title: string; detail: string }[];
  moreDetails: string[];
  facultyMembers: { name: string; office: string; qualification: string; image: string }[];
  dean: string;
  email: string;
  phone: string;
  accreditation: string;
  status: "active" | "inactive";
}

const schoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    tagline: { type: String, default: "" },
    overview: [{ type: String }],
    programmes: [
      {
        name: { type: String },
        duration: { type: String },
        details: { type: String },
      },
    ],
    facilities: [
      {
        title: { type: String },
        detail: { type: String },
      },
    ],
    moreDetails: [{ type: String }],
    facultyMembers: [
      {
        name: { type: String },
        office: { type: String },
        qualification: { type: String },
        image: { type: String, default: "" },
      },
    ],
    dean: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    accreditation: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

schoolSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<ISchool>("School", schoolSchema);

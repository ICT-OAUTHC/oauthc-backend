import mongoose, { Schema, Document } from "mongoose";

export interface IDisease extends Document {
  name: string;
  slug: string;
  category: string;
  overview: string[];
  images: string[];
  symptoms: string[];
  causes: string[];
  whenToSeeDoctor: string[];
  treatment: string[];
  prevention: string[];
  status: "published" | "draft";
}

const diseaseSchema = new Schema<IDisease>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: "" },
    overview: [{ type: String }],
    images: [{ type: String }],
    symptoms: [{ type: String }],
    causes: [{ type: String }],
    whenToSeeDoctor: [{ type: String }],
    treatment: [{ type: String }],
    prevention: [{ type: String }],
    status: { type: String, enum: ["published", "draft"], default: "draft" },
  },
  { timestamps: true }
);

diseaseSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IDisease>("Disease", diseaseSchema);

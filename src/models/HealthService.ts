import mongoose, { Schema, Document } from "mongoose";

export interface IHealthService extends Document {
  title: string;
  slug: string;
  image: string;
  tagline: string;
  iconKey: string;
  overview: string[];
  keyPoints: string[];
  additionalInfo: string[];
  whatToExpect: { title: string; detail: string }[];
  department: string;
  category: string;
  description: string;
  status: "active" | "draft" | "inactive";
}

const healthServiceSchema = new Schema<IHealthService>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    tagline: { type: String, default: "" },
    iconKey: { type: String, default: "" },
    overview: [{ type: String }],
    keyPoints: [{ type: String }],
    additionalInfo: [{ type: String }],
    whatToExpect: [{ title: { type: String }, detail: { type: String } }],
    department: { type: String, default: "" },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "draft", "inactive"], default: "active" },
  },
  { timestamps: true }
);

healthServiceSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IHealthService>("HealthService", healthServiceSchema);

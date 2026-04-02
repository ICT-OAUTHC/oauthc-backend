import mongoose, { Schema, Document } from "mongoose";

export interface ITest extends Document {
  name: string;
  slug: string;
  category: string;
  overview: string[];
  images: string[];
  whyItsDone: string[];
  howToPrepare: string[];
  whatToExpect: string[];
  results: string[];
  limitations: string[];
  department: string;
  duration: string;
  status: "published" | "draft";
}

const testSchema = new Schema<ITest>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: "" },
    overview: [{ type: String }],
    images: [{ type: String }],
    whyItsDone: [{ type: String }],
    howToPrepare: [{ type: String }],
    whatToExpect: [{ type: String }],
    results: [{ type: String }],
    limitations: [{ type: String }],
    department: { type: String, default: "" },
    duration: { type: String, default: "" },
    status: { type: String, enum: ["published", "draft"], default: "draft" },
  },
  { timestamps: true }
);

testSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<ITest>("Test", testSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IResearchEthicsPage extends Document {
  about: string;
  mandate: string;
  requirements: string;
  process: string;
  contact: string;
}

const researchEthicsPageSchema = new Schema<IResearchEthicsPage>(
  {
    about: { type: String, default: "" },
    mandate: { type: String, default: "" },
    requirements: { type: String, default: "" },
    process: { type: String, default: "" },
    contact: { type: String, default: "" },
  },
  { timestamps: true }
);

researchEthicsPageSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IResearchEthicsPage>("ResearchEthicsPage", researchEthicsPageSchema);

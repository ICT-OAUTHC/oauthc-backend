import mongoose, { Schema, Document } from "mongoose";

export interface IResearchEthics extends Document {
  applicantName: string;
  email: string;
  yesCount: number;
  noCount: number;
  naCount: number;
  researchProposal?: string;
  applicationForm?: string;
  informedConsent?: string;
  subjectInfoSheet?: string;
  questionnaire?: string;
  proforma?: string;
  interviewForm?: string;
  advertisement?: string;
  consultantLetter?: string;
  dataSheet?: string;
  compensationStatement?: string;
  isotopeClearance?: string;
  status: "received" | "under-review" | "approved" | "rejected";
  responseNote?: string;
  submittedAt: Date;
}

const researchEthicsSchema = new Schema<IResearchEthics>(
  {
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    yesCount: { type: Number, default: 0 },
    noCount: { type: Number, default: 0 },
    naCount: { type: Number, default: 0 },
    researchProposal: { type: String },
    applicationForm: { type: String },
    informedConsent: { type: String },
    subjectInfoSheet: { type: String },
    questionnaire: { type: String },
    proforma: { type: String },
    interviewForm: { type: String },
    advertisement: { type: String },
    consultantLetter: { type: String },
    dataSheet: { type: String },
    compensationStatement: { type: String },
    isotopeClearance: { type: String },
    status: {
      type: String,
      enum: ["received", "under-review", "approved", "rejected"],
      default: "received",
    },
    responseNote: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

researchEthicsSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IResearchEthics>("ResearchEthics", researchEthicsSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface INewsletter extends Document {
  email: string;
  status: "active" | "unsubscribed";
  subscribedAt: Date;
  unsubscribeToken: string;
}

const newsletterSchema = new Schema<INewsletter>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    status: { type: String, enum: ["active", "unsubscribed"], default: "active" },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribeToken: { type: String },
  },
  { timestamps: true }
);

newsletterSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.unsubscribeToken;
    return ret;
  },
});

export default mongoose.model<INewsletter>("Newsletter", newsletterSchema);

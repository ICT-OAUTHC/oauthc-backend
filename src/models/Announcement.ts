import mongoose, { Schema, Document } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  body: string;
  date: Date;
  status: "active" | "draft" | "expired";
  priority: "normal" | "urgent";
  image?: string;
  link?: string;
  featured: boolean;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "draft", "expired"], default: "draft" },
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
    image: { type: String },
    link: { type: String },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

announcementSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IAnnouncement>("Announcement", announcementSchema);

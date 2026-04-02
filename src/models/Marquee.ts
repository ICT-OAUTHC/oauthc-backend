import mongoose, { Schema, Document } from "mongoose";

export interface IMarqueeItem extends Document {
  text: string;
  type: "info" | "urgent" | "event";
  link?: string;
  isExternal?: boolean;
  active: boolean;
  order: number;
}

export interface IMarqueeSettings extends Document {
  enabled: boolean;
  speed: "slow" | "normal" | "fast";
}

const marqueeItemSchema = new Schema<IMarqueeItem>(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ["info", "urgent", "event"], default: "info" },
    link: { type: String },
    isExternal: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

marqueeItemSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const marqueeSettingsSchema = new Schema<IMarqueeSettings>(
  {
    enabled: { type: Boolean, default: true },
    speed: { type: String, enum: ["slow", "normal", "fast"], default: "normal" },
  },
  { timestamps: true }
);

marqueeSettingsSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const MarqueeItem = mongoose.model<IMarqueeItem>("MarqueeItem", marqueeItemSchema);
export const MarqueeSettings = mongoose.model<IMarqueeSettings>("MarqueeSettings", marqueeSettingsSchema);

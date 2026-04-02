import mongoose, { Schema, Document } from "mongoose";

export interface ILocation extends Document {
  name: string;
  slug: string;
  image: string;
  address: string;
  mapsQuery: string;
  type: "main" | "department" | "centre";
  phone: string;
  contacts: { label?: string; number: string }[];
  hours: string;
  lat: number;
  lng: number;
  status: "active" | "inactive";
}

const locationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    address: { type: String, default: "" },
    mapsQuery: { type: String, default: "" },
    type: { type: String, enum: ["main", "department", "centre"], default: "department" },
    phone: { type: String, default: "" },
    contacts: [{ label: { type: String }, number: { type: String } }],
    hours: { type: String, default: "" },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

locationSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<ILocation>("Location", locationSchema);

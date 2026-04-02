import mongoose, { Schema, Document } from "mongoose";

export interface IFacility {
  title: string;
  detail: string;
}

export interface IProcedure {
  name: string;
  description: string;
}

export interface IDepartment extends Document {
  name: string;
  slug: string;
  image: string;
  description: string;
  overview: string[];
  conditions: string[];
  facilities: IFacility[];
  procedures: IProcedure[];
  head: string;
  phone: string;
  email: string;
  location: string;
  status: "active" | "inactive";
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    overview: { type: [String], default: [] },
    conditions: { type: [String], default: [] },
    facilities: {
      type: [{ title: { type: String, required: true }, detail: { type: String, required: true } }],
      default: [],
    },
    procedures: {
      type: [{ name: { type: String, required: true }, description: { type: String, required: true } }],
      default: [],
    },
    head: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    location: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

departmentSchema.set("toJSON", {
  transform(_doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IDepartment>("Department", departmentSchema);

import { Request } from "express";
import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff" | "doctor";
  avatar?: string;
  department?: string;
  phone?: string;
  status: "active" | "suspended" | "pending";
  joinedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  role?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

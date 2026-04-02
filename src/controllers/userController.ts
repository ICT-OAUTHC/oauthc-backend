import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest, PaginationQuery } from "../types";
import { sendSuccess, sendPaginated, sendError } from "../utils/apiResponse";
import { getPaginationOptions } from "../utils/pagination";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as PaginationQuery;
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter: Record<string, any> = {};
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    sendPaginated(res, users, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    sendError(res, "Failed to fetch users", 500);
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { sendError(res, "User not found", 404); return; }
    sendSuccess(res, user);
  } catch (error) {
    sendError(res, "Failed to fetch user", 500);
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.create({ ...req.body, status: "active" });
    sendSuccess(res, user, 201);
  } catch (error) {
    sendError(res, "Failed to create user", 500);
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only allow safe fields
    const { role, status, department } = req.body;
    const updates: Record<string, any> = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (department !== undefined) updates.department = department;

    // Prevent admin from changing their own role/status
    if (req.params.id === req.user!._id.toString()) {
      sendError(res, "Cannot modify your own account via user management", 400);
      return;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) { sendError(res, "User not found", 404); return; }
    sendSuccess(res, user);
  } catch (error) {
    sendError(res, "Failed to update user", 500);
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) { sendError(res, "User not found", 404); return; }
    sendSuccess(res, { message: "User deleted" });
  } catch (error) {
    sendError(res, "Failed to delete user", 500);
  }
};

export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    if (!user) { sendError(res, "User not found", 404); return; }
    sendSuccess(res, user);
  } catch (error) {
    sendError(res, "Failed to approve user", 500);
  }
};

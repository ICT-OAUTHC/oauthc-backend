import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import TokenBlacklist from "../models/TokenBlacklist";
import { AuthRequest } from "../types";
import { sendError } from "../utils/apiResponse";

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendError(res, "Not authorized — no token", 401);
      return;
    }

    const token = authHeader.split(" ")[1];

    // Check if token has been blacklisted (user logged out)
    const blacklisted = await TokenBlacklist.exists({ token });
    if (blacklisted) {
      sendError(res, "Token has been invalidated — please log in again", 401);
      return;
    }

    // Verify token
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        sendError(res, "Token expired — please log in again", 401);
      } else {
        sendError(res, "Not authorized — invalid token", 401);
      }
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      sendError(res, "User belonging to this token no longer exists", 401);
      return;
    }

    if (user.status !== "active") {
      sendError(res, "Account is not active", 403);
      return;
    }

    req.user = user;
    next();
  } catch {
    sendError(res, "Authorization failed", 500);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, "Forbidden — insufficient permissions", 403);
      return;
    }
    next();
  };
};

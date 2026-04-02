import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import TokenBlacklist from "../models/TokenBlacklist";
import RefreshToken from "../models/RefreshToken";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { validatePassword, sanitizeEmail, isValidEmail } from "../utils/validatePassword";
import { notifyAdminStaff } from "../utils/notify";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../utils/email";

// ---------- Token Helpers ----------

const JWT_SECRET = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return secret;
};

const JWT_REFRESH_SECRET = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be set and at least 32 characters");
  }
  return secret;
};

const signAccessToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || "15m") as any,
  });
};

const signRefreshToken = (id: string): string => {
  return jwt.sign({ id }, JWT_REFRESH_SECRET(), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any,
  });
};

const getTokenExpiry = (token: string): Date => {
  const decoded = jwt.decode(token) as { exp?: number };
  if (decoded?.exp) {
    return new Date(decoded.exp * 1000);
  }
  return new Date(Date.now() + 15 * 60 * 1000);
};

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const issueTokenPair = async (userId: string) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  // Persist refresh token in DB so it can be revoked
  await RefreshToken.create({
    user: userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { token: accessToken, refreshToken };
};

// ---------- Login ----------

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      sendError(res, "Email and password are required", 400);
      return;
    }

    if (!isValidEmail(email)) {
      sendError(res, "Invalid email format", 400);
      return;
    }

    const normalizedEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    // Use constant-time-like response to avoid user enumeration
    if (!user || !(await user.comparePassword(password))) {
      sendError(res, "Invalid email or password", 401);
      return;
    }

    if (user.status === "pending") {
      sendError(res, "Account pending approval", 403);
      return;
    }

    if (user.status === "suspended") {
      sendError(res, "Account has been suspended", 403);
      return;
    }

    const tokens = await issueTokenPair(user._id.toString());
    sendSuccess(res, { ...tokens, user });
  } catch (error) {
    sendError(res, "Login failed", 500);
  }
};

// ---------- Refresh Token ----------

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      sendError(res, "Refresh token is required", 400);
      return;
    }

    // Verify the refresh token signature
    let decoded: { id: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET()) as { id: string };
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        // Clean up expired token from DB
        await RefreshToken.deleteOne({ token: refreshToken });
        sendError(res, "Refresh token expired — please log in again", 401);
      } else {
        sendError(res, "Invalid refresh token", 401);
      }
      return;
    }

    // Check the refresh token exists in DB (not revoked)
    const storedToken = await RefreshToken.findOne({ token: refreshToken, user: decoded.id });
    if (!storedToken) {
      // Token not in DB — possible token reuse attack. Revoke ALL tokens for this user.
      await RefreshToken.deleteMany({ user: decoded.id });
      sendError(res, "Refresh token revoked — please log in again", 401);
      return;
    }

    // Verify the user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user || user.status !== "active") {
      await RefreshToken.deleteMany({ user: decoded.id });
      sendError(res, "User not found or inactive", 401);
      return;
    }

    // Rotate: delete old refresh token, issue new pair
    await storedToken.deleteOne();
    const tokens = await issueTokenPair(user._id.toString());

    sendSuccess(res, { ...tokens, user });
  } catch (error) {
    sendError(res, "Token refresh failed", 500);
  }
};

// ---------- Signup ----------

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      sendError(res, "Name, email, and password are required", 400);
      return;
    }

    // Validate email
    if (!isValidEmail(email)) {
      sendError(res, "Invalid email format", 400);
      return;
    }

    // Validate name length
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      sendError(res, "Name must be between 2 and 100 characters", 400);
      return;
    }

    // Validate password strength
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      sendError(res, pwCheck.errors.join(". "), 400);
      return;
    }

    // Prevent self-assigning admin role via signup
    const safeRole = role === "doctor" ? "doctor" : "staff";

    const normalizedEmail = sanitizeEmail(email);

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      sendError(res, "Email already registered", 409);
      return;
    }

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password,
      role: safeRole,
      department: department?.trim(),
      status: "pending",
    });

    notifyAdminStaff(
      "New signup request",
      `${trimmedName} (${normalizedEmail}) signed up as ${safeRole} and is awaiting approval.`
    );

    sendWelcomeEmail(normalizedEmail, trimmedName);

    sendSuccess(res, { message: "Signup request submitted. Awaiting admin approval.", user }, 201);
  } catch (error) {
    sendError(res, "Signup failed", 500);
  }
};

// ---------- Forgot Password ----------

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      sendError(res, "Email is required", 400);
      return;
    }

    if (!isValidEmail(email)) {
      sendError(res, "Invalid email format", 400);
      return;
    }

    const normalizedEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    // Always return same response regardless of whether user exists (prevent enumeration)
    if (user) {
      // Generate a secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      // Store hashed token + expiry on user
      (user as any).resetPasswordToken = hashedToken;
      (user as any).resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      sendPasswordResetEmail(normalizedEmail, user.name, resetToken);
    }

    sendSuccess(res, { message: "If an account with that email exists, a reset link has been sent." });
  } catch (error) {
    sendError(res, "Failed to process request", 500);
  }
};

// ---------- Reset Password ----------

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      sendError(res, "Token and new password are required", 400);
      return;
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      sendError(res, pwCheck.errors.join(". "), 400);
      return;
    }

    // Hash the token to compare with what's stored
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    } as any).select("+password");

    if (!user) {
      sendError(res, "Invalid or expired reset token", 400);
      return;
    }

    user.password = password;
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpires = undefined;
    await user.save();

    // Revoke all refresh tokens — forces re-login on all devices
    await RefreshToken.deleteMany({ user: user._id });

    sendSuccess(res, { message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    sendError(res, "Failed to reset password", 500);
  }
};

// ---------- Get Me ----------

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  sendSuccess(res, req.user);
};

// ---------- Update Me ----------

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar, phone } = req.body;

    // Only allow updating safe fields
    const updates: Record<string, any> = {};
    if (name) {
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 100) {
        sendError(res, "Name must be between 2 and 100 characters", 400);
        return;
      }
      updates.name = trimmed;
    }
    if (avatar) updates.avatar = avatar;
    if (phone) updates.phone = phone.trim();

    if (Object.keys(updates).length === 0) {
      sendError(res, "No valid fields to update", 400);
      return;
    }

    const user = await User.findByIdAndUpdate(req.user!._id, updates, {
      new: true,
      runValidators: true,
    });
    sendSuccess(res, user);
  } catch (error) {
    sendError(res, "Failed to update profile", 500);
  }
};

// ---------- Change Password ----------

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      sendError(res, "Current and new passwords are required", 400);
      return;
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      sendError(res, pwCheck.errors.join(". "), 400);
      return;
    }

    const user = await User.findById(req.user!._id).select("+password");
    if (!user || !(await user.comparePassword(currentPassword))) {
      sendError(res, "Current password is incorrect", 401);
      return;
    }

    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens — forces re-login on all devices
    await RefreshToken.deleteMany({ user: user._id });

    sendSuccess(res, { message: "Password changed successfully" });
  } catch (error) {
    sendError(res, "Failed to change password", 500);
  }
};

// ---------- Logout ----------

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const expiresAt = getTokenExpiry(token);

      // Blacklist the access token
      await TokenBlacklist.create({ token, expiresAt }).catch(() => {});
    }

    // Revoke the refresh token if provided
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken, user: req.user!._id });
    }

    sendSuccess(res, { message: "Logged out successfully" });
  } catch (error) {
    sendError(res, "Logout failed", 500);
  }
};

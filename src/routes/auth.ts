import { Router } from "express";
import { login, signup, forgotPassword, resetPassword, refresh, getMe, updateMe, changePassword, logout } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);

router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.post("/change-password", protect, changePassword);
router.post("/logout", protect, logout);

export default router;

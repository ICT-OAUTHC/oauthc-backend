import { Router } from "express";
import { signUpload, deleteMedia } from "../controllers/mediaController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

router.post("/sign-upload", protect, signUpload);
router.delete("/:publicId", protect, authorize("admin", "staff"), deleteMedia);

export default router;

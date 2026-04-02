import { Router } from "express";
import { getUsers, getUser, createUser, updateUser, deleteUser, approveUser } from "../controllers/userController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/approve", approveUser);

export default router;

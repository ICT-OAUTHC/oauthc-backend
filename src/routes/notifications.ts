import { Router, Request, Response } from "express";
import { getNotifications, markRead, markAllRead } from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/", getNotifications as unknown as (req: Request, res: Response) => void);
router.patch("/read-all", markAllRead as unknown as (req: Request, res: Response) => void);
router.patch("/:id/read", markRead as unknown as (req: Request, res: Response) => void);

export default router;

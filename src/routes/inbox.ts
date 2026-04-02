import { Router } from "express";
import {
  getContacts, getContact, markContactRead, markContactReplied, deleteContact, submitContact,
  getSubscribers, deleteSubscriber, markUnsubscribed, subscribe, unsubscribePublic,
  getResearchEthicsApps, getResearchEthicsApp, updateResearchEthicsStatus, deleteResearchEthicsApp, submitResearchEthics,
} from "../controllers/inboxController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// Public endpoints
router.post("/contact", submitContact);
router.post("/newsletter/subscribe", subscribe);
router.post("/newsletter/unsubscribe", unsubscribePublic);
router.post("/research-ethics/apply", submitResearchEthics);

// Protected inbox endpoints
router.get("/inbox/contact", protect, authorize("admin", "staff"), getContacts);
router.get("/inbox/contact/:id", protect, authorize("admin", "staff"), getContact);
router.patch("/inbox/contact/:id/read", protect, authorize("admin", "staff"), markContactRead);
router.patch("/inbox/contact/:id/replied", protect, authorize("admin", "staff"), markContactReplied);
router.delete("/inbox/contact/:id", protect, authorize("admin"), deleteContact);

router.get("/inbox/newsletter", protect, authorize("admin", "staff"), getSubscribers);
router.delete("/inbox/newsletter/:id", protect, authorize("admin", "staff"), deleteSubscriber);
router.patch("/inbox/newsletter/:id/unsubscribe", protect, authorize("admin", "staff"), markUnsubscribed);

router.get("/inbox/research-ethics", protect, authorize("admin", "staff"), getResearchEthicsApps);
router.get("/inbox/research-ethics/:id", protect, authorize("admin", "staff"), getResearchEthicsApp);
router.patch("/inbox/research-ethics/:id/status", protect, authorize("admin", "staff"), updateResearchEthicsStatus);
router.delete("/inbox/research-ethics/:id", protect, authorize("admin"), deleteResearchEthicsApp);

export default router;

import { Router } from "express";
import {
  announcements, doctors, departments, healthServices, diseases, tests, locations, schools,
  getResearchEthicsPage, updateResearchEthicsPage,
  getMarqueePublic, getMarqueeAdmin, createMarqueeItem, updateMarqueeItem, deleteMarqueeItem, updateMarqueeSettings,
} from "../controllers/cmsController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// --- Public CMS routes ---
router.get("/cms/announcements", announcements.listPublic);
router.get("/cms/announcements/:id", announcements.getPublic);

router.get("/cms/doctors", doctors.listPublic);
router.get("/cms/doctors/:slug", doctors.getPublic);

router.get("/cms/departments", departments.listPublic);
router.get("/cms/departments/:slug", departments.getPublic);

router.get("/cms/health-services", healthServices.listPublic);
router.get("/cms/health-services/:slug", healthServices.getPublic);

router.get("/cms/diseases", diseases.listPublic);
router.get("/cms/diseases/:slug", diseases.getPublic);

router.get("/cms/tests", tests.listPublic);
router.get("/cms/tests/:slug", tests.getPublic);

router.get("/cms/research-ethics-page", getResearchEthicsPage);

router.get("/cms/locations", locations.listPublic);
router.get("/cms/locations/:id", locations.getPublic);

router.get("/cms/schools", schools.listPublic);
router.get("/cms/schools/:slug", schools.getPublic);

router.get("/cms/marquee", getMarqueePublic);

// --- Admin CMS routes ---
const adminStaff = [protect, authorize("admin", "staff")];
const adminOnly = [protect, authorize("admin")];

router.get("/admin/cms/announcements", ...adminStaff, announcements.listAdmin);
router.post("/admin/cms/announcements", ...adminStaff, announcements.create);
router.patch("/admin/cms/announcements/:id", ...adminStaff, announcements.update);
router.delete("/admin/cms/announcements/:id", ...adminOnly, announcements.delete);

router.get("/admin/cms/doctors", ...adminStaff, doctors.listAdmin);
router.post("/admin/cms/doctors", ...adminStaff, doctors.create);
router.patch("/admin/cms/doctors/:id", ...adminStaff, doctors.update);
router.delete("/admin/cms/doctors/:id", ...adminOnly, doctors.delete);

router.get("/admin/cms/departments", ...adminStaff, departments.listAdmin);
router.post("/admin/cms/departments", ...adminStaff, departments.create);
router.patch("/admin/cms/departments/:id", ...adminStaff, departments.update);
router.delete("/admin/cms/departments/:id", ...adminOnly, departments.delete);

router.get("/admin/cms/health-services", ...adminStaff, healthServices.listAdmin);
router.post("/admin/cms/health-services", ...adminStaff, healthServices.create);
router.patch("/admin/cms/health-services/:id", ...adminStaff, healthServices.update);
router.delete("/admin/cms/health-services/:id", ...adminOnly, healthServices.delete);

router.get("/admin/cms/diseases", ...adminOnly, diseases.listAdmin);
router.post("/admin/cms/diseases", ...adminOnly, diseases.create);
router.patch("/admin/cms/diseases/:id", ...adminOnly, diseases.update);
router.delete("/admin/cms/diseases/:id", ...adminOnly, diseases.delete);

router.get("/admin/cms/tests", ...adminOnly, tests.listAdmin);
router.post("/admin/cms/tests", ...adminOnly, tests.create);
router.patch("/admin/cms/tests/:id", ...adminOnly, tests.update);
router.delete("/admin/cms/tests/:id", ...adminOnly, tests.delete);

router.get("/admin/cms/research-ethics-page", ...adminStaff, getResearchEthicsPage);
router.put("/admin/cms/research-ethics-page", ...adminStaff, updateResearchEthicsPage);

router.get("/admin/cms/locations", ...adminStaff, locations.listAdmin);
router.post("/admin/cms/locations", ...adminStaff, locations.create);
router.patch("/admin/cms/locations/:id", ...adminStaff, locations.update);
router.delete("/admin/cms/locations/:id", ...adminOnly, locations.delete);

router.get("/admin/cms/schools", ...adminOnly, schools.listAdmin);
router.post("/admin/cms/schools", ...adminOnly, schools.create);
router.patch("/admin/cms/schools/:id", ...adminOnly, schools.update);
router.delete("/admin/cms/schools/:id", ...adminOnly, schools.delete);

router.get("/admin/cms/marquee", ...adminStaff, getMarqueeAdmin);
router.post("/admin/cms/marquee/items", ...adminStaff, createMarqueeItem);
router.patch("/admin/cms/marquee/items/:id", ...adminStaff, updateMarqueeItem);
router.delete("/admin/cms/marquee/items/:id", ...adminStaff, deleteMarqueeItem);
router.put("/admin/cms/marquee/settings", ...adminStaff, updateMarqueeSettings);

export default router;

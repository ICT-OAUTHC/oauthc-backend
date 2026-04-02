import { Request, Response } from "express";
import Announcement from "../models/Announcement";
import Doctor from "../models/Doctor";
import Department from "../models/Department";
import HealthService from "../models/HealthService";
import Disease from "../models/Disease";
import Test from "../models/Test";
import ResearchEthicsPage from "../models/ResearchEthicsPage";
import Location from "../models/Location";
import School from "../models/School";
import { MarqueeItem, MarqueeSettings } from "../models/Marquee";
import { PaginationQuery } from "../types";
import { sendSuccess, sendPaginated, sendError } from "../utils/apiResponse";
import { getPaginationOptions } from "../utils/pagination";
import { slugify } from "../utils/slugify";

// Generic CRUD factory for CMS models
const createCRUD = (Model: any, resourceName: string, options?: { slugField?: string; publicFilter?: Record<string, any> }) => {
  const { slugField, publicFilter = {} } = options || {};

  return {
    // Public list (filtered by status)
    listPublic: async (req: Request, res: Response): Promise<void> => {
      try {
        const query = req.query as PaginationQuery;
        const { page, limit, skip, sort } = getPaginationOptions(query);

        const filter: Record<string, any> = { ...publicFilter };
        if (query.search) {
          filter.$or = [
            { name: { $regex: query.search, $options: "i" } },
            { title: { $regex: query.search, $options: "i" } },
          ];
        }

        const [items, total] = await Promise.all([
          Model.find(filter).sort(sort).skip(skip).limit(limit),
          Model.countDocuments(filter),
        ]);

        sendPaginated(res, items, { total, page, limit, totalPages: Math.ceil(total / limit) });
      } catch (error) {
        sendError(res, `Failed to fetch ${resourceName}`, 500);
      }
    },

    // Public single by slug or id
    getPublic: async (req: Request, res: Response): Promise<void> => {
      try {
        const identifier = req.params.slug || req.params.id;
        const item = slugField
          ? await Model.findOne({ [slugField]: identifier, ...publicFilter })
          : await Model.findOne({ _id: identifier, ...publicFilter });
        if (!item) { sendError(res, `${resourceName} not found`, 404); return; }
        sendSuccess(res, item);
      } catch (error) {
        sendError(res, `Failed to fetch ${resourceName}`, 500);
      }
    },

    // Admin list (all items)
    listAdmin: async (req: Request, res: Response): Promise<void> => {
      try {
        const query = req.query as PaginationQuery;
        const { page, limit, skip, sort } = getPaginationOptions(query);

        const filter: Record<string, any> = {};
        if (query.status) filter.status = query.status;
        if (query.search) {
          filter.$or = [
            { name: { $regex: query.search, $options: "i" } },
            { title: { $regex: query.search, $options: "i" } },
          ];
        }

        const [items, total] = await Promise.all([
          Model.find(filter).sort(sort).skip(skip).limit(limit),
          Model.countDocuments(filter),
        ]);

        sendPaginated(res, items, { total, page, limit, totalPages: Math.ceil(total / limit) });
      } catch (error) {
        sendError(res, `Failed to fetch ${resourceName}`, 500);
      }
    },

    // Admin create
    create: async (req: Request, res: Response): Promise<void> => {
      try {
        const data = { ...req.body };
        if (slugField && (data.name || data.title) && !data.slug) {
          data.slug = slugify(data.name || data.title);
        }
        const item = await Model.create(data);
        sendSuccess(res, item, 201);
      } catch (error) {
        sendError(res, `Failed to create ${resourceName}`, 500);
      }
    },

    // Admin update
    update: async (req: Request, res: Response): Promise<void> => {
      try {
        const data = { ...req.body };
        if (slugField && (data.name || data.title) && !data.slug) {
          data.slug = slugify(data.name || data.title);
        }
        const item = await Model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!item) { sendError(res, `${resourceName} not found`, 404); return; }
        sendSuccess(res, item);
      } catch (error) {
        sendError(res, `Failed to update ${resourceName}`, 500);
      }
    },

    // Admin delete
    delete: async (req: Request, res: Response): Promise<void> => {
      try {
        const item = await Model.findByIdAndDelete(req.params.id);
        if (!item) { sendError(res, `${resourceName} not found`, 404); return; }
        sendSuccess(res, { message: `${resourceName} deleted` });
      } catch (error) {
        sendError(res, `Failed to delete ${resourceName}`, 500);
      }
    },
  };
};

export const announcements = createCRUD(Announcement, "Announcement", { publicFilter: { status: "active" } });
export const doctors = createCRUD(Doctor, "Doctor", { slugField: "slug", publicFilter: { status: "active" } });
export const departments = createCRUD(Department, "Department", { slugField: "slug", publicFilter: { status: "active" } });
export const healthServices = createCRUD(HealthService, "Health Service", { slugField: "slug", publicFilter: { status: "active" } });
export const diseases = createCRUD(Disease, "Disease", { slugField: "slug", publicFilter: { status: "published" } });
export const tests = createCRUD(Test, "Test", { slugField: "slug", publicFilter: { status: "published" } });
export const locations = createCRUD(Location, "Location", { slugField: "slug", publicFilter: { status: "active" } });
export const schools = createCRUD(School, "School", { slugField: "slug", publicFilter: { status: "active" } });

// --- Research Ethics Page (singleton) ---

export const getResearchEthicsPage = async (_req: Request, res: Response): Promise<void> => {
  try {
    let page = await ResearchEthicsPage.findOne();
    if (!page) page = await ResearchEthicsPage.create({});
    sendSuccess(res, page);
  } catch (error) {
    sendError(res, "Failed to fetch research ethics page", 500);
  }
};

export const updateResearchEthicsPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = await ResearchEthicsPage.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    sendSuccess(res, page);
  } catch (error) {
    sendError(res, "Failed to update research ethics page", 500);
  }
};

// --- Marquee ---

export const getMarqueePublic = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [items, settings] = await Promise.all([
      MarqueeItem.find({ active: true }).sort({ order: 1 }),
      MarqueeSettings.findOne(),
    ]);
    sendSuccess(res, { items, settings: settings || { enabled: true, speed: "normal" } });
  } catch (error) {
    sendError(res, "Failed to fetch marquee", 500);
  }
};

export const getMarqueeAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [items, settings] = await Promise.all([
      MarqueeItem.find().sort({ order: 1 }),
      MarqueeSettings.findOne(),
    ]);
    sendSuccess(res, { items, settings: settings || { enabled: true, speed: "normal" } });
  } catch (error) {
    sendError(res, "Failed to fetch marquee", 500);
  }
};

export const createMarqueeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await MarqueeItem.create(req.body);
    sendSuccess(res, item, 201);
  } catch (error) {
    sendError(res, "Failed to create marquee item", 500);
  }
};

export const updateMarqueeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await MarqueeItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) { sendError(res, "Marquee item not found", 404); return; }
    sendSuccess(res, item);
  } catch (error) {
    sendError(res, "Failed to update marquee item", 500);
  }
};

export const deleteMarqueeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await MarqueeItem.findByIdAndDelete(req.params.id);
    if (!item) { sendError(res, "Marquee item not found", 404); return; }
    sendSuccess(res, { message: "Marquee item deleted" });
  } catch (error) {
    sendError(res, "Failed to delete marquee item", 500);
  }
};

export const updateMarqueeSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await MarqueeSettings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );
    sendSuccess(res, settings);
  } catch (error) {
    sendError(res, "Failed to update marquee settings", 500);
  }
};

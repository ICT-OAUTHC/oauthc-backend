import { Request, Response } from "express";
import Contact from "../models/Contact";
import Newsletter from "../models/Newsletter";
import ResearchEthics from "../models/ResearchEthics";
import { PaginationQuery } from "../types";
import { sendSuccess, sendPaginated, sendError } from "../utils/apiResponse";
import { getPaginationOptions } from "../utils/pagination";
import crypto from "crypto";
import { notifyAdminStaff } from "../utils/notify";
import { sendContactAcknowledgement, sendResearchEthicsAcknowledgement } from "../utils/email";

// --- Contact ---

export const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as PaginationQuery;
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
        { subject: { $regex: query.search, $options: "i" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort(sort).skip(skip).limit(limit),
      Contact.countDocuments(filter),
    ]);

    sendPaginated(res, contacts, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    sendError(res, "Failed to fetch contacts", 500);
  }
};

export const getContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) { sendError(res, "Contact not found", 404); return; }
    sendSuccess(res, contact);
  } catch (error) {
    sendError(res, "Failed to fetch contact", 500);
  }
};

export const markContactRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status: "read" }, { new: true });
    if (!contact) { sendError(res, "Contact not found", 404); return; }
    sendSuccess(res, contact);
  } catch (error) {
    sendError(res, "Failed to update contact", 500);
  }
};

export const markContactReplied = async (req: Request, res: Response): Promise<void> => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status: "replied" }, { new: true });
    if (!contact) { sendError(res, "Contact not found", 404); return; }
    sendSuccess(res, contact);
  } catch (error) {
    sendError(res, "Failed to update contact", 500);
  }
};

export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) { sendError(res, "Contact not found", 404); return; }
    sendSuccess(res, { message: "Contact deleted" });
  } catch (error) {
    sendError(res, "Failed to delete contact", 500);
  }
};

export const submitContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      sendError(res, "All fields are required", 400);
      return;
    }
    const contact = await Contact.create({ name, email, subject, message });

    notifyAdminStaff(
      "New contact form",
      `${name} submitted a contact form: "${subject}".`
    );

    sendContactAcknowledgement(email, { name, subject });

    sendSuccess(res, contact, 201);
  } catch (error) {
    sendError(res, "Failed to submit contact form", 500);
  }
};

// --- Newsletter ---

export const getSubscribers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as PaginationQuery;
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.email = { $regex: query.search, $options: "i" };
    }

    const [subscribers, total] = await Promise.all([
      Newsletter.find(filter).sort(sort).skip(skip).limit(limit),
      Newsletter.countDocuments(filter),
    ]);

    sendPaginated(res, subscribers, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    sendError(res, "Failed to fetch subscribers", 500);
  }
};

export const deleteSubscriber = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);
    if (!subscriber) { sendError(res, "Subscriber not found", 404); return; }
    sendSuccess(res, { message: "Subscriber removed" });
  } catch (error) {
    sendError(res, "Failed to remove subscriber", 500);
  }
};

export const markUnsubscribed = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriber = await Newsletter.findByIdAndUpdate(
      req.params.id, { status: "unsubscribed" }, { new: true }
    );
    if (!subscriber) { sendError(res, "Subscriber not found", 404); return; }
    sendSuccess(res, subscriber);
  } catch (error) {
    sendError(res, "Failed to unsubscribe", 500);
  }
};

export const subscribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { sendError(res, "Email is required", 400); return; }

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.status === "unsubscribed") {
        existing.status = "active";
        await existing.save();
        sendSuccess(res, { message: "Re-subscribed successfully" });
        return;
      }
      sendError(res, "Already subscribed", 409);
      return;
    }

    const unsubscribeToken = crypto.randomBytes(32).toString("hex");
    await Newsletter.create({ email, unsubscribeToken });

    notifyAdminStaff(
      "New newsletter subscriber",
      `${email} subscribed to the newsletter.`
    );

    sendSuccess(res, { message: "Subscribed successfully" }, 201);
  } catch (error) {
    sendError(res, "Failed to subscribe", 500);
  }
};

export const unsubscribePublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) { sendError(res, "Token is required", 400); return; }

    const subscriber = await Newsletter.findOneAndUpdate(
      { unsubscribeToken: token },
      { status: "unsubscribed" },
      { new: true }
    );
    if (!subscriber) { sendError(res, "Invalid unsubscribe token", 404); return; }
    sendSuccess(res, { message: "Unsubscribed successfully" });
  } catch (error) {
    sendError(res, "Failed to unsubscribe", 500);
  }
};

// --- Research Ethics ---

export const getResearchEthicsApps = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as PaginationQuery;
    const { page, limit, skip, sort } = getPaginationOptions(query);

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { applicantName: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }

    const [applications, total] = await Promise.all([
      ResearchEthics.find(filter).sort(sort).skip(skip).limit(limit),
      ResearchEthics.countDocuments(filter),
    ]);

    sendPaginated(res, applications, { total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    sendError(res, "Failed to fetch applications", 500);
  }
};

export const getResearchEthicsApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const app = await ResearchEthics.findById(req.params.id);
    if (!app) { sendError(res, "Application not found", 404); return; }
    sendSuccess(res, app);
  } catch (error) {
    sendError(res, "Failed to fetch application", 500);
  }
};

export const updateResearchEthicsStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, responseNote } = req.body;
    if (!status) { sendError(res, "Status is required", 400); return; }

    const app = await ResearchEthics.findByIdAndUpdate(
      req.params.id,
      { status, ...(responseNote && { responseNote }) },
      { new: true }
    );
    if (!app) { sendError(res, "Application not found", 404); return; }
    sendSuccess(res, app);
  } catch (error) {
    sendError(res, "Failed to update application", 500);
  }
};

export const deleteResearchEthicsApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const app = await ResearchEthics.findByIdAndDelete(req.params.id);
    if (!app) { sendError(res, "Application not found", 404); return; }
    sendSuccess(res, { message: "Application deleted" });
  } catch (error) {
    sendError(res, "Failed to delete application", 500);
  }
};

export const submitResearchEthics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicantName, email } = req.body;
    if (!applicantName || !email) {
      sendError(res, "Applicant name and email are required", 400);
      return;
    }
    const app = await ResearchEthics.create(req.body);

    notifyAdminStaff(
      "New research ethics application",
      `${applicantName} (${email}) submitted a research ethics application.`
    );

    sendResearchEthicsAcknowledgement(email, applicantName);

    sendSuccess(res, app, 201);
  } catch (error) {
    sendError(res, "Failed to submit application", 500);
  }
};

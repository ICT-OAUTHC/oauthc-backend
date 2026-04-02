import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import { sendSuccess, sendError } from "../utils/apiResponse";

export const signUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folder = "oauthc" } = req.body;
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET as string
    );

    sendSuccess(res, {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (error) {
    sendError(res, "Failed to generate upload signature", 500);
  }
};

export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const publicId = req.params.publicId as string;
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      sendError(res, "Failed to delete media", 400);
      return;
    }

    sendSuccess(res, { message: "Media deleted" });
  } catch (error) {
    sendError(res, "Failed to delete media", 500);
  }
};

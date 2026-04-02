import { Response } from "express";
import { PaginationMeta } from "../types";

export const sendSuccess = (res: Response, data: any, statusCode = 200) => {
  return res.status(statusCode).json({ data });
};

export const sendPaginated = (
  res: Response,
  data: any[],
  meta: PaginationMeta
) => {
  return res.status(200).json({ data, meta });
};

export const sendError = (res: Response, message: string, statusCode = 400) => {
  return res.status(statusCode).json({ error: message, statusCode });
};

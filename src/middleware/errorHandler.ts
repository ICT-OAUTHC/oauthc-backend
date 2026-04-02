import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    res.status(400).json({ error: messages.join(", "), statusCode: 400 });
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    res.status(409).json({ error: `${field} already exists`, statusCode: 409 });
    return;
  }

  if (err.name === "CastError") {
    res.status(400).json({ error: "Invalid ID format", statusCode: 400 });
    return;
  }

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
    statusCode: err.statusCode || 500,
  });
};

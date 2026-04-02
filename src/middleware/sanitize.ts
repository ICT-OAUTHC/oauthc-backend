import { Request, Response, NextFunction } from "express";

/**
 * Recursively strip keys starting with $ or containing . from an object.
 * Prevents NoSQL injection via operators like { "$gt": "" } in req.body/params.
 *
 * Express 5 makes req.query read-only, so we only sanitize body and params.
 * Query params are strings by default and don't pose the same injection risk
 * unless parsed into objects — Express 5's query parser returns plain strings.
 */
function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    clean[key] = sanitize(obj[key]);
  }
  return clean;
}

export const sanitizeInputs = (_req: Request, _res: Response, next: NextFunction): void => {
  if (_req.body && typeof _req.body === "object") {
    _req.body = sanitize(_req.body);
  }
  if (_req.params && typeof _req.params === "object") {
    try { Object.assign(_req.params, sanitize(_req.params)); } catch { /* read-only in some cases */ }
  }
  next();
};

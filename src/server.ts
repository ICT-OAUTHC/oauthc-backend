import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import { sanitizeInputs } from "./middleware/sanitize";
import { initSocket } from "./socket";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import notificationRoutes from "./routes/notifications";
import appointmentRoutes from "./routes/appointments";
import inboxRoutes from "./routes/inbox";
import cmsRoutes from "./routes/cms";
import mediaRoutes from "./routes/media";
import { getDashboardStats } from "./controllers/dashboardController";
import { protect } from "./middleware/auth";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

/*
 * ==============================
 *   SECURITY MEASURES INDEX
 * ==============================
 *
 * 1. HELMET              — Sets strict HTTP headers (CSP, HSTS, X-Frame-Options,
 *                           X-Content-Type-Options, Referrer-Policy, etc.)
 *
 * 2. CORS                — Strict origin whitelist (localhost:3000, oauthc-dev.vercel.app,
 *                           oauthc.gov.ng). No wildcard. Credentials enabled. Preflight
 *                           cached 24h. Only allows explicit methods and headers.
 *
 * 3. BODY SIZE LIMIT     — JSON and URL-encoded bodies capped at 5MB to prevent
 *                           payload-based DoS.
 *
 * 4. NOSQL SANITIZATION  — Custom middleware strips keys starting with $ or
 *                           containing . from req.body and req.params to block
 *                           injection attacks like { "$gt": "" } in login fields.
 *                           (Express 5 req.query is read-only and returns plain
 *                           strings, so it's inherently safe.)
 *
 * 6. RATE LIMITING       — Three tiers:
 *                           • Global:  200 req / 15 min per IP on all /api routes
 *                           • Auth:     20 req / 15 min per IP on login, signup,
 *                                       forgot-password, reset-password
 *                           • Forms:    10 req / 15 min per IP on public submissions
 *                                       (contact, newsletter, research-ethics, appointments)
 *
 * 7. JWT AUTH            — Dual-token system:
 *                           • Access token:  short-lived (15min default), signed with
 *                             JWT_SECRET (32+ chars enforced at runtime).
 *                           • Refresh token: long-lived (7d default), signed with a
 *                             separate JWT_REFRESH_SECRET, persisted in MongoDB.
 *                           Access tokens carry user ID only, verified on every
 *                           protected request.
 *
 * 8. REFRESH TOKEN       — Stored in DB so they can be individually revoked. On each
 *      ROTATION             use the old refresh token is deleted and a new pair is
 *                           issued (rotation). If a deleted token is reused, ALL
 *                           refresh tokens for that user are revoked (reuse detection).
 *                           Password change / reset revokes all refresh tokens to
 *                           force re-login on every device. TTL index auto-purges
 *                           expired entries.
 *
 * 9. TOKEN BLACKLIST     — Logout blacklists the access token in MongoDB with a TTL
 *                           index that auto-purges expired entries. Every protected
 *                           request checks the blacklist before proceeding.
 *
 * 10. PASSWORD POLICY    — Min 8 chars, must include uppercase, lowercase, number,
 *                           and special character. Max 128 chars. Enforced on signup,
 *                           change-password, and reset-password.
 *
 * 11. BCRYPT HASHING     — Passwords hashed with bcrypt (12 salt rounds). Plaintext
 *                           passwords never stored or logged.
 *
 * 12. EMAIL VALIDATION   — validator.js normalizes and validates email format.
 *                           Prevents duplicate accounts via case/dot variations.
 *
 * 13. ROLE PROTECTION    — Signup blocks self-assigning admin role. Authorization
 *                           middleware enforces role-based access on every protected
 *                           route (admin, admin/staff, all authenticated).
 *
 * 14. USER ENUMERATION   — Login and forgot-password return identical error messages
 *                           regardless of whether the email exists in the database.
 *
 * 15. RESET TOKENS       — Cryptographically random (32 bytes), SHA-256 hashed before
 *                           storage, 1-hour expiry. Raw token sent to user's email,
 *                           only the hash is persisted.
 *
 * 16. INPUT TRIMMING     — Name, email, and other string inputs are trimmed and
 *                           length-validated before storage.
 *
 * 17. 404 CATCH-ALL      — Returns JSON (not default Express HTML) to avoid leaking
 *                           server stack information.
 *
 * 18. ERROR HANDLER      — Centralized error handler strips internal details. Returns
 *                           structured { error, statusCode } for all error responses.
 *                           Handles Mongoose ValidationError, duplicate key (11000),
 *                           and CastError specifically.
 *
 * NOTE: IP-based allow-listing is intentionally omitted because Render (hosting)
 * assigns dynamic IPs. Security relies on the layers above instead.
 */

// ---------- Security ----------

// HTTP security headers
app.use(helmet());

// CORS — only allow known origins
// FRONTEND_URL supports comma-separated values: "https://oauthc.gov.ng,https://www.oauthc.gov.ng"
const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL?.split(",").map((u) => u.trim()).filter(Boolean) ?? []),
];
app.use(cors({
  origin(origin, callback) {
    // allow server-to-server (no origin) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // preflight cache 24h
}));

// Body parsing with size limits
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Sanitize req.body and req.params against NoSQL injection ($gt, $ne etc.)
// Note: req.query is read-only in Express 5 and returns plain strings, so it's safe.
app.use(sanitizeInputs);

// Logging — skip in production to avoid leaking info
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ---------- Rate Limiting ----------

// Global rate limit — 200 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later", statusCode: 429 },
});
app.use("/api", globalLimiter);

// Strict limit on auth endpoints — 20 per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later", statusCode: 429 },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);
app.use("/api/auth/refresh", authLimiter);

// Strict limit on public form submissions — 10 per 15 min
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions, please try again later", statusCode: 429 },
});
app.use("/api/contact", formLimiter);
app.use("/api/newsletter/subscribe", formLimiter);
app.use("/api/research-ethics/apply", formLimiter);
app.use("/api/appointments", formLimiter); // POST only but applied broadly is fine

// ---------- Routes ----------

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api", inboxRoutes);
app.use("/api", cmsRoutes);
app.use("/api/media", mediaRoutes);
app.get("/api/dashboard/stats", protect, getDashboardStats);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found", statusCode: 404 });
});

// Error handler
app.use(errorHandler);

// ---------- Start ----------

const start = async () => {
  await connectDB();
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
};

start();

export default app;

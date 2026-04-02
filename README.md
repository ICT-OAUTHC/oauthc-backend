# OAUTHC Backend API

REST API for the Obafemi Awolowo University Teaching Hospitals Complex (OAUTHC) website. Built with Express 5, TypeScript, and MongoDB.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5 (TypeScript)
- **Database**: MongoDB Atlas (Mongoose 9)
- **Auth**: JWT dual-token (access + refresh) with bcrypt password hashing
- **Email**: Resend
- **Media**: Cloudinary (signed uploads)
- **Real-time**: Socket.IO (notifications)
- **Hosting**: Render

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm (or npm)
- MongoDB Atlas cluster (or local MongoDB)

### Install

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Access token secret (min 32 chars) |
| `JWT_EXPIRES_IN` | Access token TTL (default `15m`) |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (default `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Comma-separated allowed origins (e.g. `https://oauthc.gov.ng,https://www.oauthc.gov.ng`) |
| `RESEND_API_KEY` | Resend API key (optional — emails silently skipped if absent) |
| `EMAIL_FROM` | Sender address (e.g. `OAUTHC <noreply@notify.oauthc.gov.ng>`) |

### Seed Admin User

Run once to create the initial admin account:

```bash
pnpm run seed
```

This creates `admin@oauthc.gov.ng` / `Admin@12345`. **Change the password immediately after first login.**

### Run

```bash
# Development (hot reload via tsx)
pnpm run dev

# Production
pnpm run build
pnpm start
```

### Deploy to Render

| Setting | Value |
|---|---|
| Build Command | `pnpm install && pnpm build` |
| Start Command | `pnpm start` |

Set all environment variables from the table above in the Render dashboard. `typescript` and `@types/*` are in `dependencies` (not devDependencies) so they're available during the build step.

---

## Project Structure

```
src/
  config/          # Database connection, Cloudinary setup
  controllers/     # Route handlers (business logic)
  middleware/       # Auth, error handling, input sanitization
  models/          # Mongoose schemas
  routes/          # Express route definitions
  seeds/           # Database seeders
  types/           # TypeScript interfaces
  utils/           # Shared helpers (email, notifications, pagination, etc.)
  server.ts        # App entry point
  socket.ts        # Socket.IO setup
```

---

## API Routes

All routes are prefixed with `/api`.

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/login` | No | Login with email & password |
| POST | `/signup` | No | Create account (pending approval) |
| POST | `/forgot-password` | No | Send password reset email |
| POST | `/reset-password` | No | Reset password with token |
| POST | `/refresh` | No | Refresh access token |
| GET | `/me` | Yes | Get current user profile |
| PATCH | `/me` | Yes | Update own profile |
| POST | `/change-password` | Yes | Change password (requires current) |
| POST | `/logout` | Yes | Logout (blacklists token) |

### Users (`/api/users`) — Admin only

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List users (paginated, filterable by role/status) |
| GET | `/:id` | Get single user |
| POST | `/` | Create user |
| PATCH | `/:id` | Update user (role, status, etc.) |
| DELETE | `/:id` | Delete user |
| PATCH | `/:id/approve` | Approve pending user |

### Appointments (`/api/appointments`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | No | Book appointment (public) |
| GET | `/` | Yes | List appointments (role-filtered) |
| GET | `/:id` | Yes | Get single appointment |
| PATCH | `/:id/confirm` | Admin/Staff | Confirm appointment |
| PATCH | `/:id/cancel` | Admin/Staff | Cancel appointment |
| PATCH | `/:id/reschedule` | Admin/Staff | Reschedule appointment |
| PATCH | `/:id/assign` | Admin/Staff | Assign/reassign doctor |
| DELETE | `/:id` | Admin | Delete appointment |

### CMS — Public (`/api/cms/...`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cms/announcements` | List announcements |
| GET | `/cms/announcements/:id` | Get announcement |
| GET | `/cms/doctors` | List doctors |
| GET | `/cms/doctors/:slug` | Get doctor by slug |
| GET | `/cms/departments` | List departments |
| GET | `/cms/departments/:slug` | Get department by slug |
| GET | `/cms/health-services` | List health services |
| GET | `/cms/health-services/:slug` | Get health service by slug |
| GET | `/cms/diseases` | List diseases/symptoms |
| GET | `/cms/diseases/:slug` | Get disease by slug |
| GET | `/cms/tests` | List tests/procedures |
| GET | `/cms/tests/:slug` | Get test by slug |
| GET | `/cms/locations` | List locations |
| GET | `/cms/locations/:id` | Get location |
| GET | `/cms/schools` | List schools |
| GET | `/cms/schools/:slug` | Get school by slug |
| GET | `/cms/marquee` | Get marquee items & settings |
| GET | `/cms/research-ethics-page` | Get research ethics page content |

### CMS — Admin (`/api/admin/cms/...`)

Each CMS resource follows the same CRUD pattern:

```
GET    /admin/cms/{resource}        — List (paginated)
POST   /admin/cms/{resource}        — Create
PATCH  /admin/cms/{resource}/:id    — Update
DELETE /admin/cms/{resource}/:id    — Delete (admin only)
```

Resources: `announcements`, `doctors`, `departments`, `health-services`, `diseases`, `tests`, `locations`, `schools`

Special routes:
- `GET/PUT /admin/cms/research-ethics-page` — single-document page content
- `GET /admin/cms/marquee` — list items + settings
- `POST /admin/cms/marquee/items` — create item
- `PATCH /admin/cms/marquee/items/:id` — update item
- `DELETE /admin/cms/marquee/items/:id` — delete item
- `PUT /admin/cms/marquee/settings` — update marquee settings

### Inbox — Public Submissions (`/api/...`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/contact` | No | Submit contact form |
| POST | `/newsletter/subscribe` | No | Subscribe to newsletter |
| POST | `/newsletter/unsubscribe` | No | Unsubscribe (public) |
| POST | `/research-ethics/apply` | No | Submit research ethics application |

### Inbox — Admin (`/api/inbox/...`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/inbox/contact` | Admin/Staff | List contact submissions |
| GET | `/inbox/contact/:id` | Admin/Staff | Get contact submission |
| PATCH | `/inbox/contact/:id/read` | Admin/Staff | Mark as read |
| PATCH | `/inbox/contact/:id/replied` | Admin/Staff | Mark as replied |
| DELETE | `/inbox/contact/:id` | Admin | Delete contact |
| GET | `/inbox/newsletter` | Admin/Staff | List subscribers |
| DELETE | `/inbox/newsletter/:id` | Admin/Staff | Remove subscriber |
| PATCH | `/inbox/newsletter/:id/unsubscribe` | Admin/Staff | Mark unsubscribed |
| GET | `/inbox/research-ethics` | Admin/Staff | List applications |
| GET | `/inbox/research-ethics/:id` | Admin/Staff | Get application |
| PATCH | `/inbox/research-ethics/:id/status` | Admin/Staff | Update status + note |
| DELETE | `/inbox/research-ethics/:id` | Admin | Delete application |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List user's notifications |
| PATCH | `/read-all` | Yes | Mark all as read |
| PATCH | `/:id/read` | Yes | Mark one as read |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Yes | Role-based dashboard statistics |

### Media (`/api/media`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/sign-upload` | Yes | Get Cloudinary signed upload params |
| DELETE | `/:publicId` | Admin/Staff | Delete media from Cloudinary |

### Health Check

```
GET /api/health → { status: "ok", timestamp: "..." }
```

---

## Authentication Flow

1. **Login** returns an access token (15min) and refresh token (7d)
2. Access token is sent as `Authorization: Bearer <token>` on every request
3. When access token expires, the client sends the refresh token to `/auth/refresh` to get a new pair
4. **Refresh token rotation**: each use deletes the old token and issues a new one
5. **Reuse detection**: if a deleted refresh token is reused, ALL tokens for that user are revoked
6. **Logout** blacklists the access token (TTL-indexed in MongoDB)
7. **Password change/reset** revokes all refresh tokens across devices

## Roles & Permissions

| Role | Access |
|---|---|
| `admin` | Full access to all resources |
| `staff` | CMS (most sections), inbox, appointments — no user management, no delete |
| `doctor` | Own appointments, own profile |

New accounts are created with `status: "pending"` and must be approved by an admin.

---

## Security

- **Helmet** for HTTP security headers
- **CORS** with strict origin whitelist (from `FRONTEND_URL` env var)
- **Rate limiting**: 200/15min global, 20/15min auth endpoints, 10/15min form submissions
- **NoSQL injection protection** via custom sanitizer (strips `$` and `.` keys)
- **Body size limit** of 5MB
- **bcrypt** (12 rounds) for password hashing
- **Password policy**: 8-128 chars, uppercase + lowercase + number + special char
- **User enumeration prevention**: login and forgot-password return identical errors
- **Reset tokens**: 32 random bytes, SHA-256 hashed, 1-hour expiry

---

## Real-Time Notifications

Socket.IO is used to push notifications to logged-in admin/staff users in real time. The server authenticates WebSocket connections using the same JWT. Events that trigger notifications:

- New user signup
- Appointment booked
- Contact form submitted
- Newsletter subscription
- Research ethics application submitted

---

## Email Notifications

Sent via Resend. If `RESEND_API_KEY` is not set, emails are silently skipped (logged to console). Templates:

- Welcome email (on signup)
- Appointment booked / confirmed / cancelled / rescheduled / doctor assigned
- Contact form acknowledgement
- Research ethics acknowledgement
- Password reset link

---

## Mongoose Models

| Model | Collection | Description |
|---|---|---|
| `User` | users | Staff accounts (admin, staff, doctor) |
| `Appointment` | appointments | Patient appointment bookings |
| `Announcement` | announcements | News/announcements |
| `Doctor` | doctors | Doctor profiles |
| `Department` | departments | Hospital departments |
| `HealthService` | healthservices | Health service pages |
| `Disease` | diseases | Diseases & symptoms encyclopedia |
| `Test` | tests | Tests & procedures encyclopedia |
| `Location` | locations | Hospital campus locations |
| `School` | schools | Affiliated schools |
| `Marquee` | marquees | Scrolling marquee items + settings |
| `Contact` | contacts | Contact form submissions |
| `Newsletter` | newsletters | Newsletter subscribers |
| `ResearchEthics` | researchethics | Ethics committee applications |
| `ResearchEthicsPage` | researchethicspages | CMS content for the ethics page |
| `Notification` | notifications | In-app notifications |
| `RefreshToken` | refreshtokens | Active refresh tokens (TTL-indexed) |
| `TokenBlacklist` | tokenblacklists | Revoked access tokens (TTL-indexed) |

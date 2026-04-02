import { Resend } from "resend";

let resend: Resend | null = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}
const FROM = process.env.EMAIL_FROM || "OAUTHC <noreply@oauthc.gov.ng>";
const FRONTEND = (process.env.FRONTEND_URL?.split(",")[0]?.trim()) || "https://oauthc-dev.vercel.app";

// ── Shared layout ────────────────────────────────────────────────────────────

function layout(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#14532d;padding:28px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px">${title}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;color:#374151;font-size:15px;line-height:1.7">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:12px">Obafemi Awolowo University Teaching Hospitals Complex</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:12px">Ile-Ife, Osun State, Nigeria</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(url: string, label: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td>
    <a href="${url}" style="display:inline-block;background:#14532d;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">${label}</a>
  </td></tr></table>`;
}

function field(label: string, value: string) {
  return `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;vertical-align:top">${label}</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500">${value}</td></tr>`;
}

function detailsTable(fields: [string, string][]) {
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%">${fields.map(([l, v]) => field(l, v)).join("")}</table>`;
}

// ── Send helper ──────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  const client = getResend();
  if (!client) {
    console.log(`[EMAIL SKIPPED] No RESEND_API_KEY — would send "${subject}" to ${to}`);
    return;
  }
  try {
    await client.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send "${subject}" to ${to}:`, err);
  }
}

// ── Email functions ──────────────────────────────────────────────────────────

/** User signed up — welcome email */
export async function sendWelcomeEmail(to: string, name: string) {
  const html = layout("Welcome to OAUTHC", `
    <p>Hello <strong>${name}</strong>,</p>
    <p>Thank you for creating an account with the Obafemi Awolowo University Teaching Hospitals Complex (OAUTHC) portal.</p>
    <p>Your account is currently <strong>pending approval</strong>. An administrator will review and approve your account shortly. You will be notified once your account is active.</p>
    ${btn(`${FRONTEND}/admin/login`, "Go to Portal")}
    <p style="color:#6b7280;font-size:13px">If you did not create this account, please ignore this email.</p>
  `);
  await send(to, "Welcome to OAUTHC Portal", html);
}

/** Appointment booked — confirmation to patient */
export async function sendAppointmentBooked(to: string, data: { patient: string; date: string; time: string; department: string }) {
  const html = layout("Appointment Requested", `
    <p>Hello <strong>${data.patient}</strong>,</p>
    <p>Your appointment request has been received and is currently <strong>pending confirmation</strong>. Our team will review it shortly.</p>
    ${detailsTable([
      ["Date", data.date],
      ["Time", data.time],
      ["Department", data.department],
    ])}
    <p style="color:#6b7280;font-size:13px">You will receive an email once your appointment is confirmed or if any changes are made.</p>
  `);
  await send(to, "Appointment Request Received — OAUTHC", html);
}

/** Appointment confirmed */
export async function sendAppointmentConfirmed(to: string, data: { patient: string; date: string; time: string; department: string; doctor?: string }) {
  const fields: [string, string][] = [
    ["Date", data.date],
    ["Time", data.time],
    ["Department", data.department],
  ];
  if (data.doctor) fields.push(["Doctor", data.doctor]);

  const html = layout("Appointment Confirmed", `
    <p>Hello <strong>${data.patient}</strong>,</p>
    <p>Your appointment has been <strong style="color:#15803d">confirmed</strong>. Please find the details below:</p>
    ${detailsTable(fields)}
    <p>Please arrive at least 15 minutes before your scheduled time.</p>
    <p style="color:#6b7280;font-size:13px">If you need to reschedule, please contact us as soon as possible.</p>
  `);
  await send(to, "Appointment Confirmed — OAUTHC", html);
}

/** Appointment cancelled */
export async function sendAppointmentCancelled(to: string, data: { patient: string; date: string; time: string; reason: string; cancelledBy: string }) {
  const html = layout("Appointment Cancelled", `
    <p>Hello <strong>${data.patient}</strong>,</p>
    <p>We regret to inform you that your appointment has been <strong style="color:#dc2626">cancelled</strong>.</p>
    ${detailsTable([
      ["Original Date", data.date],
      ["Original Time", data.time],
      ["Reason", data.reason],
      ["Cancelled By", data.cancelledBy],
    ])}
    <p>If you would like to book a new appointment, please visit our portal or contact us directly.</p>
    ${btn(`${FRONTEND}/book-appointment`, "Book New Appointment")}
  `);
  await send(to, "Appointment Cancelled — OAUTHC", html);
}

/** Appointment rescheduled */
export async function sendAppointmentRescheduled(to: string, data: { patient: string; newDate: string; newTime: string; reason: string; rescheduledBy: string }) {
  const html = layout("Appointment Rescheduled", `
    <p>Hello <strong>${data.patient}</strong>,</p>
    <p>Your appointment has been <strong style="color:#d97706">rescheduled</strong>. Please see the new details below:</p>
    ${detailsTable([
      ["New Date", data.newDate],
      ["New Time", data.newTime],
      ["Reason", data.reason],
      ["Rescheduled By", data.rescheduledBy],
    ])}
    <p>Please arrive at least 15 minutes before your new scheduled time.</p>
    <p style="color:#6b7280;font-size:13px">If this time does not work for you, please contact us to arrange an alternative.</p>
  `);
  await send(to, "Appointment Rescheduled — OAUTHC", html);
}

/** Doctor assigned or reassigned */
export async function sendDoctorAssigned(to: string, data: { patient: string; date: string; time: string; doctor: string; department: string; isReassignment: boolean; notes?: string }) {
  const title = data.isReassignment ? "Doctor Reassigned" : "Doctor Assigned";
  const intro = data.isReassignment
    ? "Your appointment has been reassigned to a different doctor."
    : "A doctor has been assigned to your appointment.";

  const fields: [string, string][] = [
    ["Doctor", data.doctor],
    ["Department", data.department],
    ["Date", data.date],
    ["Time", data.time],
  ];
  if (data.notes) fields.push(["Notes", data.notes]);

  const html = layout(title, `
    <p>Hello <strong>${data.patient}</strong>,</p>
    <p>${intro}</p>
    ${detailsTable(fields)}
    <p style="color:#6b7280;font-size:13px">If you have any questions, please contact our team.</p>
  `);
  await send(to, `${title} — OAUTHC`, html);
}

/** Contact form — acknowledgement to sender */
export async function sendContactAcknowledgement(to: string, data: { name: string; subject: string }) {
  const html = layout("We Received Your Message", `
    <p>Hello <strong>${data.name}</strong>,</p>
    <p>Thank you for reaching out to OAUTHC. We have received your message regarding <strong>"${data.subject}"</strong> and our team will get back to you as soon as possible.</p>
    <p style="color:#6b7280;font-size:13px">If your matter is urgent, please call our front desk directly.</p>
  `);
  await send(to, "We Received Your Message — OAUTHC", html);
}

/** Research ethics application — acknowledgement to applicant */
export async function sendResearchEthicsAcknowledgement(to: string, name: string) {
  const html = layout("Application Received", `
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your research ethics application has been successfully submitted to the OAUTHC Research Ethics Committee.</p>
    <p>Our committee will review your application and you will be notified of the outcome. This process typically takes 2–4 weeks.</p>
    <p style="color:#6b7280;font-size:13px">If you have any questions about your application, please contact the Research Ethics office.</p>
  `);
  await send(to, "Research Ethics Application Received — OAUTHC", html);
}

/** Forgot password — reset link */
export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  const url = `${FRONTEND}/reset-password?token=${resetToken}`;
  const html = layout("Password Reset", `
    <p>Hello <strong>${name}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    ${btn(url, "Reset Password")}
    <p style="color:#6b7280;font-size:13px">This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">If the button doesn't work, copy and paste this URL into your browser:<br><a href="${url}" style="color:#14532d;word-break:break-all">${url}</a></p>
  `);
  await send(to, "Reset Your Password — OAUTHC", html);
}

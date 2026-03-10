/**
 * Mail Service
 * Sends transactional emails via Nodemailer SMTP.
 */

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL =
  process.env.SMTP_FROM || process.env.SES_FROM_EMAIL || SMTP_USER;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth:
    SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

async function sendEmail({ to, subject, htmlBody, textBody }) {
  if (!FROM_EMAIL) {
    throw new Error(
      "SMTP_FROM (or SES_FROM_EMAIL/SMTP_USER fallback) is not set",
    );
  }
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS are required for Nodemailer SMTP");
  }

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html: htmlBody,
    text: textBody,
  });
}

/**
 * Send a scheduling reminder email
 * @param {Object} params
 * @param {string} params.to - recipient email
 * @param {string} params.platform
 * @param {string} params.scheduledAt - ISO date string
 * @param {string} params.timezone
 * @param {string} params.title
 * @param {string} params.contentPreview
 */
export async function sendScheduleReminder({
  to,
  platform,
  scheduledAt,
  timezone,
  title,
  contentPreview,
}) {
  const localTime = new Date(scheduledAt).toLocaleString("en-IN", {
    timeZone: timezone || "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  const preview = contentPreview
    ? contentPreview.slice(0, 200) + (contentPreview.length > 200 ? "..." : "")
    : "No preview available.";

  const subject = "Your content is scheduled to post today";

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #111;">📅 Posting Reminder</h2>
      <p style="color: #555;">Your scheduled post is ready to go live.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px; width: 120px;">Platform</td>
          <td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${platform}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px;">Scheduled</td>
          <td style="padding: 8px 0; font-weight: bold;">${localTime} (${timezone})</td>
        </tr>
        ${title ? `<tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Title</td><td style="padding: 8px 0; font-weight: bold;">${title}</td></tr>` : ""}
      </table>
      <div style="margin-top: 24px; padding: 16px; background: #fff; border-left: 4px solid #6366f1; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #555; font-style: italic;">${preview}</p>
      </div>
      <p style="margin-top: 24px; font-size: 14px; color: #888;">
        Open your <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/planning" style="color: #6366f1;">KindCrew dashboard</a> to publish now.
      </p>
    </div>
  `;

  const textBody = `
Posting Reminder

Platform: ${platform}
Scheduled: ${localTime} (${timezone})
${title ? `Title: ${title}\n` : ""}
Preview:
${preview}

Open your dashboard to publish now: ${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/planning
  `.trim();

  return sendEmail({ to, subject, htmlBody, textBody });
}

/**
 * Send immediate confirmation email when a post is scheduled.
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.platform
 * @param {string} params.scheduledAt
 * @param {string} params.timezone
 * @param {string} params.title
 * @param {string} params.source
 */
export async function sendScheduleConfirmation({
  to,
  platform,
  scheduledAt,
  timezone,
  title,
  source,
}) {
  const localTime = new Date(scheduledAt).toLocaleString("en-IN", {
    timeZone: timezone || "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  const subject = "Schedule Confirmed - KindCrew";

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #111; margin-top: 0;">Schedule Confirmed</h2>
      <p style="color: #555;">Your post has been successfully scheduled.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px; width: 140px;">Platform</td>
          <td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${platform}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px;">Scheduled for</td>
          <td style="padding: 8px 0; font-weight: bold;">${localTime} (${timezone})</td>
        </tr>
        ${title ? `<tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Title</td><td style="padding: 8px 0; font-weight: bold;">${title}</td></tr>` : ""}
        ${source ? `<tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Source</td><td style="padding: 8px 0; text-transform: capitalize;">${source}</td></tr>` : ""}
      </table>
      <p style="margin-top: 20px; font-size: 14px; color: #888;">
        You can manage this from your
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/planning" style="color: #111; font-weight: 600;">
          Planning Dashboard
        </a>.
      </p>
    </div>
  `;

  const textBody = `
Schedule Confirmed

Your post has been scheduled successfully.

Platform: ${platform}
Scheduled for: ${localTime} (${timezone})
${title ? `Title: ${title}` : ""}
${source ? `Source: ${source}` : ""}

Manage it here: ${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/planning
  `.trim();

  return sendEmail({ to, subject, htmlBody, textBody });
}

/**
 * Send cancellation confirmation email when a scheduled post is deleted.
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.platform
 * @param {string} params.scheduledAt
 * @param {string} params.timezone
 * @param {string} params.title
 */
export async function sendScheduleCancellation({
  to,
  platform,
  scheduledAt,
  timezone,
  title,
}) {
  const localTime = new Date(scheduledAt).toLocaleString("en-IN", {
    timeZone: timezone || "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  const subject = "Schedule Cancelled - KindCrew";

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #111; margin-top: 0;">Schedule Cancelled</h2>
      <p style="color: #555;">Your scheduled post has been cancelled and its reminder has been removed.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px; width: 140px;">Platform</td>
          <td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${platform}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px;">Cancelled slot</td>
          <td style="padding: 8px 0; font-weight: bold;">${localTime} (${timezone})</td>
        </tr>
        ${title ? `<tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Title</td><td style="padding: 8px 0; font-weight: bold;">${title}</td></tr>` : ""}
      </table>
      <p style="margin-top: 20px; font-size: 14px; color: #888;">
        You can schedule a new post anytime from your
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/planning" style="color: #111; font-weight: 600;">
          Planning Dashboard
        </a>.
      </p>
    </div>
  `;

  const textBody = `
Schedule Cancelled

Your scheduled post has been cancelled and its reminder has been removed.

Platform: ${platform}
Cancelled slot: ${localTime} (${timezone})
${title ? `Title: ${title}` : ""}

Manage schedules here: ${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/planning
  `.trim();

  return sendEmail({ to, subject, htmlBody, textBody });
}

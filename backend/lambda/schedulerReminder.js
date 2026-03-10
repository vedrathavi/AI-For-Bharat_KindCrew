import nodemailer from "nodemailer";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "ap-south-1";
const FROM_EMAIL =
  process.env.SMTP_FROM || process.env.SES_FROM_EMAIL || process.env.SMTP_USER;
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const TABLE_NAME =
  process.env.DYNAMODB_SCHEDULED_POSTS_TABLE || "KindCrew-ScheduledPosts";
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || "KindCrew-Users";

const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth:
    SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

const ddbDoc = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION }),
  {
    marshallOptions: { removeUndefinedValues: true },
  },
);

function formatLocalTime(scheduledAt, timezone) {
  return new Date(scheduledAt).toLocaleString("en-IN", {
    timeZone: timezone || "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });
}

function buildEmail({
  platform,
  scheduledAt,
  timezone,
  title,
  contentPreview,
}) {
  const localTime = formatLocalTime(scheduledAt, timezone);
  const preview = contentPreview
    ? contentPreview.slice(0, 200) + (contentPreview.length > 200 ? "..." : "")
    : "No preview available.";

  return {
    subject: "Your content is scheduled to post today",
    text: `Posting Reminder\n\nPlatform: ${platform}\nScheduled: ${localTime} (${timezone})\n${title ? `Title: ${title}\n` : ""}\nPreview:\n${preview}\n\nOpen your dashboard: ${FRONTEND_URL}/dashboard/planning`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #111;">Posting Reminder</h2>
        <p style="color: #555;">Your scheduled post is ready to go live.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px; width: 120px;">Platform</td>
            <td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${platform || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Scheduled</td>
            <td style="padding: 8px 0; font-weight: bold;">${localTime} (${timezone || "Asia/Kolkata"})</td>
          </tr>
          ${title ? `<tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Title</td><td style="padding: 8px 0; font-weight: bold;">${title}</td></tr>` : ""}
        </table>
        <div style="margin-top: 24px; padding: 16px; background: #fff; border-left: 4px solid #6366f1; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #555; font-style: italic;">${preview}</p>
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #888;">
          Open your
          <a href="${FRONTEND_URL}/dashboard/planning" style="color: #111; font-weight: 600;">
            Planning Dashboard
          </a>
          to publish now.
        </p>
      </div>
    `,
  };
}

export const handler = async (event) => {
  const payload = typeof event === "string" ? JSON.parse(event) : event || {};
  const { userId, eventId, userEmail } = payload;

  if (!FROM_EMAIL) {
    throw new Error(
      "SMTP_FROM (or SES_FROM_EMAIL/SMTP_USER fallback) is not set in Lambda environment",
    );
  }
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP_USER and SMTP_PASS are required in Lambda environment",
    );
  }
  if (!userId || !eventId) {
    throw new Error("Missing required fields: userId, eventId");
  }

  const itemResult = await ddbDoc.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, eventId },
    }),
  );

  const schedule = itemResult.Item;
  if (!schedule) {
    console.warn(`Schedule not found for ${userId}/${eventId}; skipping`);
    return { ok: true, skipped: true, reason: "schedule-not-found" };
  }

  let recipientEmail = userEmail;
  if (!recipientEmail) {
    const userResult = await ddbDoc.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      }),
    );
    recipientEmail = userResult.Item?.email;
  }

  if (!recipientEmail) {
    throw new Error(`Could not resolve recipient email for userId=${userId}`);
  }

  // Idempotency guard to avoid duplicate reminder emails from retries.
  if (schedule.notification?.emailSent || schedule.status === "completed") {
    return { ok: true, skipped: true, reason: "already-processed" };
  }

  const message = buildEmail({
    platform: schedule.platform,
    scheduledAt: schedule.scheduledAt,
    timezone: schedule.timezone,
    title: schedule.contentSnapshot?.title,
    contentPreview: schedule.contentSnapshot?.text,
  });

  await mailer.sendMail({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  await ddbDoc.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, eventId },
      UpdateExpression:
        "SET #status = :status, #notification = :notification, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
        "#notification": "notification",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":status": "completed",
        ":notification": { emailSent: true },
        ":updatedAt": new Date().toISOString(),
      },
    }),
  );

  return { ok: true, userId, eventId };
};

import dotenv from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const tableName = process.env.DYNAMODB_SCHEDULED_POSTS_TABLE || "KindCrew-ScheduledPosts";

function fmt(iso, tz) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: tz || "Asia/Kolkata",
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function main() {
  const res = await doc.send(new ScanCommand({ TableName: tableName, Limit: 25 }));
  const items = res.Items || [];
  console.log(`items=${items.length}`);
  const now = Date.now();

  for (const item of items) {
    const scheduledMs = item.scheduledAt ? new Date(item.scheduledAt).getTime() : 0;
    const deltaMin = Math.round((scheduledMs - now) / 60000);
    console.log(
      JSON.stringify({
        userId: item.userId,
        eventId: item.eventId,
        status: item.status,
        emailSent: item.notification?.emailSent,
        timezone: item.timezone,
        scheduledAtUtc: item.scheduledAt,
        scheduledLocal: item.scheduledAt ? fmt(item.scheduledAt, item.timezone) : null,
        deltaMinutesFromNow: deltaMin,
      })
    );
  }
}

main().catch((err) => {
  console.error("checkScheduledPosts error:", err.message);
  process.exit(1);
});

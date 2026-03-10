/**
 * EventBridge Service
 * Creates / deletes one-time EventBridge rules to trigger the
 * Lambda reminder at the exact scheduled UTC time.
 *
 * Rule naming convention:  kindcrew-schedule-{eventId}
 * Target Lambda ARN:        process.env.SCHEDULER_LAMBDA_ARN
 */

import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
  RemoveTargetsCommand,
  DeleteRuleCommand,
} from "@aws-sdk/client-eventbridge";

const ebClient = new EventBridgeClient({
  region: process.env.AWS_REGION || "ap-south-1",
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
});

const LAMBDA_ARN = process.env.SCHEDULER_LAMBDA_ARN;
const ROLE_ARN = process.env.EVENTBRIDGE_ROLE_ARN; // optional: for cross-account
const TARGET_ID = "kindcrew-reminder";

/**
 * Convert ISO date to EventBridge cron expression (UTC)
 * EventBridge cron: cron(min hour day month ? year)
 */
function toCronExpression(isoDate) {
  const d = new Date(isoDate);
  const min = d.getUTCMinutes();
  const hour = d.getUTCHours();
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear();
  return `cron(${min} ${hour} ${day} ${month} ? ${year})`;
}

/**
 * Create an EventBridge rule for a scheduled post
 * @param {Object} params
 * @param {string} params.eventId
 * @param {string} params.userId
 * @param {string} params.scheduledAt  ISO UTC string
 * @param {string} params.userEmail
 * @returns {Promise<{ruleName: string}|null>}  null if Lambda ARN not configured
 */
export async function createScheduleRule({
  eventId,
  userId,
  scheduledAt,
  userEmail,
}) {
  if (!LAMBDA_ARN) {
    console.warn("⚠️  SCHEDULER_LAMBDA_ARN not set – EventBridge rule skipped");
    return null;
  }

  const ruleName = `kindcrew-schedule-${eventId}`;
  const cronExpr = toCronExpression(scheduledAt);

  // 1. Create the rule
  await ebClient.send(
    new PutRuleCommand({
      Name: ruleName,
      ScheduleExpression: cronExpr,
      State: "ENABLED",
      Description: `KindCrew reminder for event ${eventId}`,
      ...(ROLE_ARN ? { RoleArn: ROLE_ARN } : {}),
    }),
  );

  // 2. Attach the Lambda target
  await ebClient.send(
    new PutTargetsCommand({
      Rule: ruleName,
      Targets: [
        {
          Id: TARGET_ID,
          Arn: LAMBDA_ARN,
          Input: JSON.stringify({ eventId, userId, userEmail, scheduledAt }),
        },
      ],
    }),
  );

  console.log(`✅ EventBridge rule created: ${ruleName} @ ${cronExpr}`);
  return { ruleName };
}

/**
 * Delete an EventBridge rule by eventId
 */
export async function deleteScheduleRule(eventId) {
  if (!LAMBDA_ARN) return;

  const ruleName = `kindcrew-schedule-${eventId}`;
  try {
    await ebClient.send(
      new RemoveTargetsCommand({ Rule: ruleName, Ids: [TARGET_ID] }),
    );
    await ebClient.send(new DeleteRuleCommand({ Name: ruleName }));
    console.log(`🗑️  EventBridge rule deleted: ${ruleName}`);
  } catch (err) {
    // Rule may not exist if EventBridge was not configured at creation time
    console.warn("EventBridge delete warning:", err.message);
  }
}

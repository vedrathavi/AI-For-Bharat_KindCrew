import dotenv from "dotenv";
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";

dotenv.config();

const client = new EventBridgeClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function main() {
  const rulesRes = await client.send(
    new ListRulesCommand({ NamePrefix: "kindcrew-schedule-", Limit: 20 })
  );
  const rules = rulesRes.Rules || [];
  console.log(`rulesFound=${rules.length}`);

  for (const rule of rules.slice(0, 5)) {
    const targetsRes = await client.send(
      new ListTargetsByRuleCommand({ Rule: rule.Name })
    );
    const targets = (targetsRes.Targets || []).map((target) => ({
      arn: target.Arn,
      input: target.Input,
    }));
    console.log(
      JSON.stringify({
        name: rule.Name,
        state: rule.State,
        scheduleExpression: rule.ScheduleExpression,
        targets,
      })
    );
  }
}

main().catch((error) => {
  console.error("checkEventBridgeRules error:", error.message);
  process.exit(1);
});

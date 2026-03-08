import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Database Debug Check\n");
console.log("Environment Variables:");
console.log(`  AWS_REGION: ${process.env.AWS_REGION || "us-east-1"}`);
console.log(
  `  DYNAMODB_ENDPOINT: ${process.env.DYNAMODB_ENDPOINT || "AWS Default"}`,
);
console.log("");

const config = {
  region: process.env.AWS_REGION || "us-east-1",
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

console.log("Creating DynamoDB client...\n");
const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

async function debug() {
  try {
    // List tables
    console.log("📋 Listing available tables...");
    const listResult = await client.send(new ListTablesCommand({}));
    console.log(`Found tables: ${listResult.TableNames.join(", ")}\n`);

    // Describe ideation table
    const ideationTable = "KindCrew-ContentIdeas";
    console.log(`📊 Describing ${ideationTable}...`);
    const describeResult = await client.send(
      new DescribeTableCommand({ TableName: ideationTable }),
    );
    console.log(`  Status: ${describeResult.Table.TableStatus}`);
    console.log(`  Item Count: ${describeResult.Table.ItemCount}`);
    console.log(
      `  Size: ${Math.round(describeResult.Table.TableSizeBytes / 1024)} KB\n`,
    );

    // Query user-123 records
    console.log("🔎 Querying for user-123 records...\n");
    const result = await docClient.send(
      new QueryCommand({
        TableName: ideationTable,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": "user-123",
        },
      }),
    );

    console.log(`Records with userId="user-123": ${result.Items.length}\n`);

    if (result.Items.length > 0) {
      console.log("⚠️  RECORDS STILL EXIST:\n");
      result.Items.forEach((item, i) => {
        console.log(`  ${i + 1}. ideaId: ${item.ideaId}`);
        console.log(`     userId: ${item.userId}`);
        console.log(`     type: ${item.type}`);
        console.log(`     angle: ${item.angle?.substring(0, 50)}...`);
        console.log("");
      });
    } else {
      console.log("✅ No user-123 records found!\n");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:", error);
  }

  process.exit(0);
}

// Run with timeout
setTimeout(() => {
  console.error("⏱️  Timeout - AWS connection may be down");
  process.exit(1);
}, 10000);

debug();

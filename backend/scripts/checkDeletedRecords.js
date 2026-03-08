import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const IDEATION_TABLE = "KindCrew-ContentIdeas";

// IDs that should have been deleted
const idsToCheck = [
  "24327c6c-4f72-4602-8722-333506ee6c12",
  "55ed32ad-717a-469a-bbb7-c6c5e46cb0cf",
  "dd2157b6-9566-4564-ba54-94660fc73866",
];

async function checkRecords() {
  console.log("\n🔍 Checking if deleted records still exist...\n");
  console.log(`Table: ${IDEATION_TABLE}`);
  console.log(`User ID: user-123\n`);

  for (const ideaId of idsToCheck) {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: IDEATION_TABLE,
          Key: {
            userId: "user-123",
            ideaId: ideaId,
          },
        }),
      );

      if (result.Item) {
        console.log(`❌ FOUND: ${ideaId}`);
        console.log(`   Topic: ${result.Item.topic}`);
      } else {
        console.log(`✅ DELETED: ${ideaId}`);
      }
    } catch (error) {
      console.log(`⚠️  ERROR checking ${ideaId}: ${error.message}`);
    }
  }

  console.log("\n");
}

checkRecords().catch(console.error);

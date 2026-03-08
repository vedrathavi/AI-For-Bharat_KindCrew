import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const IDEATION_TABLE = "KindCrew-ContentIdeas";

/**
 * Verify current state of user-123 records
 */
async function verifyMigration() {
  console.log("\n🔍 Verifying database state...\n");

  try {
    // Query user-123 records
    console.log(`Querying ${IDEATION_TABLE} for user-123 records...`);
    const params = {
      TableName: IDEATION_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": "user-123",
      },
    };

    const result = await docClient.send(new QueryCommand(params));
    const records = result.Items || [];

    console.log(`\nRecords found: ${records.length}\n`);

    if (records.length > 0) {
      console.log("📍 User-123 records still exist:\n");
      records.forEach((record, i) => {
        console.log(`  ${i + 1}. ID: ${record.ideaId}`);
        console.log(`     Created: ${record.createdAt}`);
        console.log(`     Type: ${record.type || "N/A"}\n`);
      });
    } else {
      console.log("✅ No user-123 records found - migration successful!\n");
    }

    // Also scan to see total records in table
    console.log("Scanning total table stats...");
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: IDEATION_TABLE,
        Select: "COUNT",
      }),
    );

    console.log(`Total records in ${IDEATION_TABLE}: ${scanResult.Count}\n`);
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    throw error;
  }
}

verifyMigration().catch(console.error);

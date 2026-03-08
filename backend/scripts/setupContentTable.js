import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = "KindCrew-ContentItems";

async function setupContentTable() {
  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: TABLE_NAME,
      });
      const existingTable = await client.send(describeCommand);

      if (existingTable.Table) {
        console.log(`✅ Table '${TABLE_NAME}' already exists`);
        console.log(`Status: ${existingTable.Table.TableStatus}`);
        console.log(`Item Count: ${existingTable.Table.ItemCount}`);
        return;
      }
    } catch (error) {
      if (error.name !== "ResourceNotFoundException") {
        throw error;
      }
      // Table doesn't exist, proceed to create
    }

    console.log(`🔨 Creating table '${TABLE_NAME}'...`);

    const createTableCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        {
          AttributeName: "userId",
          KeyType: "HASH", // Partition key
        },
        {
          AttributeName: "contentId",
          KeyType: "RANGE", // Sort key
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "userId",
          AttributeType: "S",
        },
        {
          AttributeName: "contentId",
          AttributeType: "S",
        },
        {
          AttributeName: "createdAt",
          AttributeType: "S",
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "CreatedAtIndex",
          KeySchema: [
            {
              AttributeName: "userId",
              KeyType: "HASH",
            },
            {
              AttributeName: "createdAt",
              KeyType: "RANGE",
            },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      BillingMode: "PROVISIONED",
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    });

    await client.send(createTableCommand);

    console.log("⏳ Waiting for table to become active...");

    await waitUntilTableExists(
      { client, maxWaitTime: 300 },
      { TableName: TABLE_NAME }
    );

    console.log(`\n✅ Table '${TABLE_NAME}' created successfully!`);
    console.log("\nTable Structure:");
    console.log("- Partition Key: userId (String)");
    console.log("- Sort Key: contentId (String)");
    console.log("- GSI: CreatedAtIndex (userId, createdAt)");
    console.log("\nSchema Fields:");
    console.log("- contentId: unique identifier");
    console.log("- userId: creator user ID");
    console.log("- source: 'phase1' | 'manual'");
    console.log("- ideaId: reference to Phase 1 idea (if applicable)");
    console.log("- topic: content topic");
    console.log("- angle: content angle/approach");
    console.log("- targetAudience: target audience");
    console.log("- goal: content goal");
    console.log("- contentType: type of content");
    console.log("- outline: structured content outline");
    console.log("- draft: draft content text");
    console.log("- platformVariants: platform-specific packages");
    console.log("- scripts: video scripts (if applicable)");
    console.log("- distribution: distribution status and scheduling");
    console.log("- analytics: engagement metrics");
    console.log("- createdAt: creation timestamp");
    console.log("- updatedAt: last update timestamp");
  } catch (error) {
    console.error("❌ Error setting up content table:", error);
    throw error;
  }
}

// Run the setup
setupContentTable()
  .then(() => {
    console.log("\n🎉 Setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Setup failed:", error);
    process.exit(1);
  });

/**
 * KindCrew-CreatorProfiles Table Setup
 *
 * This script helps you add the required UserIdIndex GSI to your existing KindCrew-CreatorProfiles table
 *
 * The UserIdIndex GSI is required for:
 * - Finding creator profiles by userId (for getMyProfile endpoint)
 * - Retrieving user's own profile data
 */

import {
  UpdateTableCommand,
  DescribeTableCommand,
  CreateTableCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const creatorProfilesTable =
  process.env.DYNAMODB_CREATOR_PROFILES_TABLE || "KindCrew-CreatorProfiles";

const addUserIdIndex = async () => {
  try {
    console.log(`Checking table "${creatorProfilesTable}"...`);

    // Check if table exists
    try {
      const tableInfo = await client.send(
        new DescribeTableCommand({ TableName: creatorProfilesTable }),
      );

      console.log(`✓ Table "${creatorProfilesTable}" exists`);
      console.log(
        `  Current indexes: ${
          tableInfo.Table.GlobalSecondaryIndexes?.map((i) => i.IndexName).join(
            ", ",
          ) || "None"
        }`,
      );

      // Check if UserIdIndex already exists
      const hasUserIdIndex = tableInfo.Table.GlobalSecondaryIndexes?.some(
        (gsi) => gsi.IndexName === "UserIdIndex",
      );

      if (hasUserIdIndex) {
        console.log("✓ UserIdIndex already exists on KindCrew-CreatorProfiles table");
        console.log("✓ Table setup is complete!");
        return;
      }

      console.log("⚠️  UserIdIndex is missing. Adding...");

      // Check if userId attribute is already defined
      const hasUserIdAttr = tableInfo.Table.AttributeDefinitions?.some(
        (attr) => attr.AttributeName === "userId",
      );

      const attributeDefinitions = [];
      if (!hasUserIdAttr) {
        attributeDefinitions.push({
          AttributeName: "userId",
          AttributeType: "S",
        });
      }

      // Get billing mode for correct throughput config
      const billingMode =
        tableInfo.Table.BillingModeSummary?.BillingMode || "PROVISIONED";

      const gsiConfig = {
        IndexName: "UserIdIndex",
        KeySchema: [
          {
            AttributeName: "userId",
            KeyType: "HASH",
          },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
      };

      // Only add throughput for provisioned mode
      if (billingMode === "PROVISIONED") {
        gsiConfig.ProvisionedThroughput = {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        };
      }

      // Add UserIdIndex GSI
      const updateCommand = new UpdateTableCommand({
        TableName: creatorProfilesTable,
        ...(attributeDefinitions.length > 0 && {
          AttributeDefinitions: attributeDefinitions,
        }),
        GlobalSecondaryIndexUpdates: [
          {
            Create: gsiConfig,
          },
        ],
      });

      await client.send(updateCommand);
      console.log("✓ UserIdIndex added successfully!");
      console.log("\n⏳ Index is being created (this may take 1-2 minutes)");
      console.log(
        "💡 You can check the status in AWS Console: DynamoDB → Tables → KindCrew-CreatorProfiles → Indexes",
      );
      console.log(
        "\n📝 Note: Once the index is ACTIVE, profile retrieval will work correctly",
      );
    } catch (error) {
      if (error.name === "ResourceNotFoundException") {
        console.log(
          `⚠️  Table "${creatorProfilesTable}" does not exist. Creating...`,
        );

        // Create table with UserIdIndex
        const createCommand = new CreateTableCommand({
          TableName: creatorProfilesTable,
          KeySchema: [
            {
              AttributeName: "creatorId",
              KeyType: "HASH",
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: "creatorId",
              AttributeType: "S",
            },
            {
              AttributeName: "userId",
              AttributeType: "S",
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "UserIdIndex",
              KeySchema: [
                {
                  AttributeName: "userId",
                  KeyType: "HASH",
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

        await client.send(createCommand);
        console.log(
          `✓ Table "${creatorProfilesTable}" created successfully with UserIdIndex!`,
        );
        console.log("⏳ Table is being created (this may take 1-2 minutes)");
        console.log(
          "💡 You can check the status in AWS Console: DynamoDB → Tables",
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("❌ Error setting up DynamoDB:");
    console.error(error.message);
    console.error("\nPlease check:");
    console.error("1. AWS credentials are correct in .env");
    console.error("2. IAM user has DynamoDB permissions");
    console.error("3. Region is set correctly (ap-south-1)");
    process.exit(1);
  }
};

addUserIdIndex();

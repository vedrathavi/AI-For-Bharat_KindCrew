import { config } from "dotenv";
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

config(); // Load environment variables

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const IDEATION_TABLE = "KindCrew-ContentIdeas";

async function setupIdeationTable() {
  try {
    // Check if table exists
    try {
      await client.send(
        new DescribeTableCommand({ TableName: IDEATION_TABLE }),
      );
      console.log(`✅ Table ${IDEATION_TABLE} already exists`);
      return;
    } catch (error) {
      if (error.name !== "ResourceNotFoundException") {
        throw error;
      }
    }

    // Create table
    const createTableCommand = new CreateTableCommand({
      TableName: IDEATION_TABLE,
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" }, // Partition key
        { AttributeName: "ideaId", KeyType: "RANGE" }, // Sort key
      ],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "ideaId", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST", // On-demand billing
    });

    await client.send(createTableCommand);
    console.log(`✅ Created table ${IDEATION_TABLE}`);
  } catch (error) {
    console.error(`Error setting up table ${IDEATION_TABLE}:`, error);
    throw error;
  }
}

// Run setup
setupIdeationTable().catch(console.error);

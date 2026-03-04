import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const config = {
  region: process.env.AWS_REGION || "us-east-1",
};

// Add credentials if provided
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

// For local development with DynamoDB Local
if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

// Create the DynamoDB client
const client = new DynamoDBClient(config);

// Create the document client (easier to work with)
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const usersTable = process.env.DYNAMODB_USERS_TABLE || "KindCrew-Users";
export const creatorProfilesTable =
  process.env.DYNAMODB_CREATOR_PROFILES_TABLE || "KindCrew-CreatorProfiles";

export default docClient;

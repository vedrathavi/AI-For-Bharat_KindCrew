import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const IDEATION_TABLE = "KindCrew-ContentIdeas";

/**
 * Save a content idea to DynamoDB
 */
async function saveIdea(idea) {
  try {
    const params = {
      TableName: IDEATION_TABLE,
      Item: {
        ...idea,
        createdAt: new Date().toISOString(),
      },
    };

    await docClient.send(new PutCommand(params));
    return idea;
  } catch (error) {
    console.error("Error saving idea:", error);
    throw error;
  }
}

/**
 * Get a specific idea by ID
 */
async function getIdeaById(userId, ideaId) {
  try {
    const params = {
      TableName: IDEATION_TABLE,
      Key: {
        userId,
        ideaId,
      },
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error("Error fetching idea:", error);
    throw error;
  }
}

/**
 * Get all ideas for a user
 */
async function getUserIdeas(userId) {
  try {
    const params = {
      TableName: IDEATION_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error("Error fetching user ideas:", error);
    throw error;
  }
}

/**
 * Update research fields for an existing idea
 */
async function updateIdeaResearch(userId, ideaId, research = {}, keyPoints = []) {
  try {
    const params = {
      TableName: IDEATION_TABLE,
      Key: {
        userId,
        ideaId,
      },
      UpdateExpression: "SET research = :research, keyPoints = :keyPoints, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":research": research,
        ":keyPoints": Array.isArray(keyPoints) ? keyPoints : [],
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes || null;
  } catch (error) {
    console.error("Error updating idea research:", error);
    throw error;
  }
}

export { saveIdea, getIdeaById, getUserIdeas, updateIdeaResearch };

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const CONTENT_TABLE = "KindCrew-ContentItems";

/**
 * Save a complete content package to DynamoDB
 */
async function saveContent(contentPackage) {
  try {
    const params = {
      TableName: CONTENT_TABLE,
      Item: {
        ...contentPackage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await docClient.send(new PutCommand(params));
    return contentPackage;
  } catch (error) {
    console.error("Error saving content:", error);
    throw error;
  }
}

/**
 * Get a specific content item by ID
 */
async function getContentById(userId, contentId) {
  try {
    const params = {
      TableName: CONTENT_TABLE,
      Key: {
        userId,
        contentId,
      },
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error("Error fetching content:", error);
    throw error;
  }
}

/**
 * Get all content items for a user
 */
async function getUserContent(userId) {
  try {
    const params = {
      TableName: CONTENT_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false,
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error("Error fetching user content:", error);
    throw error;
  }
}

/**
 * Check if content exists for a specific ideaId
 */
async function hasContentForIdea(userId, ideaId) {
  try {
    const params = {
      TableName: CONTENT_TABLE,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "ideaId = :ideaId",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":ideaId": ideaId,
      },
      Limit: 1,
    };

    const result = await docClient.send(new QueryCommand(params));
    return (result.Items || []).length > 0;
  } catch (error) {
    console.error("Error checking content for idea:", error);
    return false;
  }
}

/**
 * Get content by ideaId
 */
async function getContentByIdeaId(userId, ideaId) {
  try {
    const params = {
      TableName: CONTENT_TABLE,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "ideaId = :ideaId",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":ideaId": ideaId,
      },
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error("Error fetching content by ideaId:", error);
    throw error;
  }
}

/**
 * Update content distribution status
 */
async function updateDistributionStatus(userId, contentId, status, scheduledAt = null) {
  try {
    const updateExpression = scheduledAt
      ? "SET distribution.#status = :status, distribution.scheduledAt = :scheduledAt, updatedAt = :updatedAt"
      : "SET distribution.#status = :status, updatedAt = :updatedAt";

    const expressionAttributeValues = scheduledAt
      ? {
          ":status": status,
          ":scheduledAt": scheduledAt,
          ":updatedAt": new Date().toISOString(),
        }
      : {
          ":status": status,
          ":updatedAt": new Date().toISOString(),
        };

    const params = {
      TableName: CONTENT_TABLE,
      Key: {
        userId,
        contentId,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error("Error updating distribution status:", error);
    throw error;
  }
}

/**
 * Update content analytics
 */
async function updateAnalytics(userId, contentId, analytics) {
  try {
    const params = {
      TableName: CONTENT_TABLE,
      Key: {
        userId,
        contentId,
      },
      UpdateExpression:
        "SET analytics.likes = :likes, analytics.comments = :comments, analytics.shares = :shares, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":likes": analytics.likes || 0,
        ":comments": analytics.comments || 0,
        ":shares": analytics.shares || 0,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error("Error updating analytics:", error);
    throw error;
  }
}

/**
 * Update platform variants (e.g., regenerate for a specific platform)
 */
async function updatePlatformVariant(userId, contentId, platform, variantData) {
  try {
    const params = {
      TableName: CONTENT_TABLE,
      Key: {
        userId,
        contentId,
      },
      UpdateExpression: `SET platformVariants.#platform = :variantData, updatedAt = :updatedAt`,
      ExpressionAttributeNames: {
        "#platform": platform,
      },
      ExpressionAttributeValues: {
        ":variantData": variantData,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error("Error updating platform variant:", error);
    throw error;
  }
}

/**
 * Delete a content item
 */
async function deleteContent(userId, contentId) {
  try {
    const params = {
      TableName: CONTENT_TABLE,
      Key: {
        userId,
        contentId,
      },
    };

    await docClient.send(new DeleteCommand(params));
    return true;
  } catch (error) {
    console.error("Error deleting content:", error);
    throw error;
  }
}

export {
  saveContent,
  getContentById,
  getUserContent,
  hasContentForIdea,
  getContentByIdeaId,
  updateDistributionStatus,
  updateAnalytics,
  updatePlatformVariant,
  deleteContent,
};

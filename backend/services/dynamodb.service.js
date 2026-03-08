import {
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import docClient, {
  usersTable,
  creatorProfilesTable,
  publishingSchedulesTable,
} from "../config/dynamodb.js";
import { v4 as uuidv4 } from "uuid";

/**
 * DynamoDB Service for KindCrew
 * Handles user operations with KindCrew-Users table
 */

class DynamoDBService {
  async scanAllItems(tableName, limit = null) {
    let items = [];
    let lastEvaluatedKey;

    do {
      const result = await docClient.send(
        new ScanCommand({
          TableName: tableName,
          ExclusiveStartKey: lastEvaluatedKey,
          Limit: limit || undefined,
        }),
      );

      items = items.concat(result.Items || []);
      lastEvaluatedKey = result.LastEvaluatedKey;

      if (limit && items.length >= limit) {
        items = items.slice(0, limit);
        break;
      }
    } while (lastEvaluatedKey);

    return items;
  }

  // Create user
  async createUser(userData) {
    const userId = uuidv4();
    const now = new Date().toISOString();

    const user = {
      userId,
      email: userData.email,
      name: userData.name,
      profileImage: userData.profileImage || null,
      givenName: userData.givenName || null,
      familyName: userData.familyName || null,
      emailVerified: userData.emailVerified || false,
      locale: userData.locale || null,
      authProviders: userData.authProviders || [],
      role: userData.role || "user",
      status: userData.status || "active",
      loginHistory: userData.loginHistory || [],
      createdAt: now,
      lastLogin: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: usersTable,
        Item: user,
      }),
    );

    return user;
  }

  // Get user by userId
  async getUserById(userId) {
    const result = await docClient.send(
      new GetCommand({
        TableName: usersTable,
        Key: { userId },
      }),
    );

    return result.Item;
  }

  // Get user by email
  async getUserByEmail(email) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: usersTable,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      }),
    );

    return result.Items?.[0];
  }

  async getAllUsers(limit = null) {
    return this.scanAllItems(usersTable, limit);
  }

  // Update user
  async updateUser(userId, updates) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
    });

    updateExpression.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const result = await docClient.send(
      new UpdateCommand({
        TableName: usersTable,
        Key: { userId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes;
  }

  // Update user on login - records login history
  async updateUserOnLogin(userId, updates, loginMethod) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Add standard updates
    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
    });

    // Add new login to history
    const loginEntry = {
      timestamp: new Date().toISOString(),
      loginMethod: loginMethod,
    };

    updateExpression.push(
      "#loginHistory = list_append(if_not_exists(#loginHistory, :empty_list), :newLogin)",
    );
    expressionAttributeNames["#loginHistory"] = "loginHistory";
    expressionAttributeValues[":empty_list"] = [];
    expressionAttributeValues[":newLogin"] = [loginEntry];

    // Update lastLogin and updatedAt
    updateExpression.push("#lastLogin = :lastLogin");
    updateExpression.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#lastLogin"] = "lastLogin";
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":lastLogin"] = new Date().toISOString();
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const result = await docClient.send(
      new UpdateCommand({
        TableName: usersTable,
        Key: { userId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes;
  }

  // ============ CREATOR PROFILE METHODS ============

  /**
   * Create creator profile
   * @param {Object} profileData - Creator profile data
   * @returns {Promise<Object>} Created profile
   */
  async createCreatorProfile(profileData) {
    const putCommand = new PutCommand({
      TableName: creatorProfilesTable,
      Item: profileData,
    });

    await docClient.send(putCommand);

    return profileData;
  }

  /**
   * Get creator profile by ID
   * @param {string} creatorId - Creator profile ID
   * @returns {Promise<Object|null>} Profile or null
   */
  async getCreatorProfile(creatorId) {
    const result = await docClient.send(
      new GetCommand({
        TableName: creatorProfilesTable,
        Key: { creatorId },
      }),
    );

    return result.Item || null;
  }

  /**
   * Get creator profile by user ID (requires GSI)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Profile or null
   */
  async getCreatorProfileByUserId(userId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: creatorProfilesTable,
        IndexName: "UserIdIndex", // GSI: userId
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      }),
    );

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  }

  /**
   * Update creator profile
   * @param {string} creatorId - Creator profile ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateCreatorProfile(creatorId, updateData) {
    // Build update expression
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(updateData).forEach((key) => {
      if (key !== "creatorId" && key !== "userId") {
        // Handle nested properties (e.g., "settings.onboardingCompleted")
        if (key.includes(".")) {
          const parts = key.split(".");
          const placeholders = parts.map((part, index) => `#${part}_${index}`);
          const valuePlaceholder = `:${key.replace(/\./g, "_")}`;

          // Build the nested path expression (e.g., "#settings_0.#onboardingCompleted_1")
          const path = placeholders.join(".");
          updateExpression.push(`${path} = ${valuePlaceholder}`);

          // Set attribute names for each part
          parts.forEach((part, index) => {
            expressionAttributeNames[placeholders[index]] = part;
          });

          expressionAttributeValues[valuePlaceholder] = updateData[key];
        } else {
          const placeholder = `#${key}`;
          updateExpression.push(`${placeholder} = :${key}`);
          expressionAttributeNames[placeholder] = key;
          expressionAttributeValues[`:${key}`] = updateData[key];
        }
      }
    });

    const result = await docClient.send(
      new UpdateCommand({
        TableName: creatorProfilesTable,
        Key: { creatorId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes;
  }

  /**
   * Delete creator profile
   * @param {string} creatorId - Creator profile ID
   * @returns {Promise<void>}
   */
  async deleteCreatorProfile(creatorId) {
    await docClient.send(
      new GetCommand({
        TableName: creatorProfilesTable,
        Key: { creatorId },
      }),
    );

    // Note: DynamoDB doesn't have a DELETE command, use UpdateCommand to mark as deleted
    // Or implement soft delete by updating status to 'deleted'
  }

  /**
   * Query creator profiles by status (requires GSI)
   * @param {string} status - Profile status
   * @returns {Promise<Array>} Profiles
   */
  async queryCreatorProfilesByStatus(status) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: creatorProfilesTable,
        IndexName: "StatusIndex", // GSI: status
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
      }),
    );

    return result.Items || [];
  }

  /**
   * Query creator profiles by niche (requires GSI)
   * @param {string} primaryNiche - Primary niche
   * @returns {Promise<Array>} Profiles
   */
  async queryCreatorProfilesByNiche(primaryNiche) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: creatorProfilesTable,
        IndexName: "NicheIndex", // GSI: niche.primary
        KeyConditionExpression: "#niche = :niche",
        ExpressionAttributeNames: {
          "#niche": "niche.primary",
        },
        ExpressionAttributeValues: {
          ":niche": primaryNiche,
        },
      }),
    );

    return result.Items || [];
  }

  // ============ PUBLISHING SCHEDULE METHODS ============

  /**
   * Create a new publishing schedule record
   * @param {Object} scheduleData
   * @returns {Promise<Object>} Created schedule
   */
  async createPublishingSchedule(scheduleData) {
    const putCommand = new PutCommand({
      TableName: publishingSchedulesTable,
      Item: scheduleData,
    });

    await docClient.send(putCommand);
    return scheduleData;
  }

  /**
   * Retrieve a schedule by its id
   * @param {string} scheduleId
   * @returns {Promise<Object|null>}
   */
  async getPublishingScheduleById(scheduleId) {
    const result = await docClient.send(
      new GetCommand({
        TableName: publishingSchedulesTable,
        Key: { scheduleId },
      }),
    );
    return result.Item || null;
  }

  /**
   * List schedules for a given user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getPublishingSchedulesByUserId(userId) {
    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: publishingSchedulesTable,
          IndexName: "UserIdIndex", // assumes a GSI on userId
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: {
            ":uid": userId,
          },
        }),
      );
      return result.Items || [];
    } catch (err) {
      console.warn(
        "⚠️  Query by UserIdIndex failed, falling back to full scan (index might be missing)",
        err.name || err.code,
        err.message,
      );
      // fallback: scan and filter manually
      const all = await this.scanAllItems(publishingSchedulesTable);
      return all.filter((item) => item.userId === userId);
    }
  }

  /**
   * Update a publishing schedule record
   * @param {string} scheduleId
   * @param {Object} updates
   * @returns {Promise<Object>} Updated schedule
   */
  async updatePublishingSchedule(scheduleId, updates) {
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(updates).forEach((key) => {
      if (key !== "scheduleId") {
        const placeholder = `#${key}`;
        updateExpression.push(`${placeholder} = :${key}`);
        expressionAttributeNames[placeholder] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });

    updateExpression.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const result = await docClient.send(
      new UpdateCommand({
        TableName: publishingSchedulesTable,
        Key: { scheduleId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes;
  }

  async getAllCreatorProfiles(limit = null) {
    return this.scanAllItems(creatorProfilesTable, limit);
  }
}

export default new DynamoDBService();

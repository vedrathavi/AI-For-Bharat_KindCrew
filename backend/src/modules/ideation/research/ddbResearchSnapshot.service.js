import {
  PutCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import docClient, { researchSnapshotsTable } from "../../../../config/dynamodb.js";

// In-memory fallback cache for snapshots (keyed by snapshotId) to ensure seamless
// refresh and lineage even when DynamoDB table is offline or in local development.
const memorySnapshotStore = new Map();

/**
 * Save a research snapshot item to DynamoDB.
 */
export async function saveSnapshot(snapshot) {
  if (!snapshot || !snapshot.snapshotId) return snapshot;

  const item = {
    ...snapshot,
    createdAt: snapshot.researchGeneratedAt || new Date().toISOString(),
  };

  // Always retain in fallback store
  memorySnapshotStore.set(snapshot.snapshotId, item);
  if (memorySnapshotStore.size > 200) {
    const oldestKey = memorySnapshotStore.keys().next().value;
    memorySnapshotStore.delete(oldestKey);
  }

  if (process.env.ENABLE_RESEARCH_SNAPSHOTS === "false") {
    return snapshot;
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: researchSnapshotsTable,
        Item: item,
      })
    );
    return snapshot;
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.warn("⚠️ [DDBSnapshot] KindCrew-ResearchSnapshots table not found. Cached in memory.");
      return snapshot;
    }
    console.error("❌ [DDBSnapshot] Error saving snapshot:", error.message);
    return snapshot;
  }
}

/**
 * Fetch a research snapshot by ID with explicit ownership verification (IDOR protection).
 */
export async function getSnapshotById(userId, snapshotId) {
  if (!userId || !snapshotId) return null;

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: researchSnapshotsTable,
        Key: {
          snapshotId,
          userId,
        },
      })
    );
    if (result.Item && result.Item.userId === userId) {
      return result.Item;
    }
  } catch (error) {
    // If table not found or query error, fall through to memory fallback
  }

  // Fallback to memory store with strict ownership check
  const cached = memorySnapshotStore.get(snapshotId);
  if (cached && cached.userId === userId) {
    return cached;
  }

  return null;
}

/**
 * Fetch a valid, unexpired snapshot by requestHash for a specific user.
 */
export async function getSnapshotByRequestHash(userId, requestHash) {
  if (!userId || !requestHash || process.env.ENABLE_RESEARCH_SNAPSHOTS === "false") {
    return null;
  }

  try {
    const params = {
      TableName: researchSnapshotsTable,
      IndexName: "RequestHashIndex",
      KeyConditionExpression: "requestHash = :hash AND userId = :uid",
      ExpressionAttributeValues: {
        ":hash": requestHash,
        ":uid": userId,
      },
    };

    const result = await docClient.send(new QueryCommand(params));
    const items = result.Items || [];

    if (items.length === 0) return null;

    // Filter for unexpired snapshots
    const now = new Date().toISOString();
    const valid = items.filter((item) => !item.expiresAt || item.expiresAt > now);

    if (valid.length === 0) return null;

    // Return the latest valid version
    valid.sort((a, b) => (b.version || 1) - (a.version || 1));
    return valid[0];
  } catch (error) {
    // If GSI or Table does not exist, return null gracefully (cache miss)
    if (
      error.name === "ResourceNotFoundException" ||
      error.message?.includes("index")
    ) {
      return null;
    }
    console.warn("⚠️ [DDBSnapshot] RequestHash lookup failed:", error.message);
    return null;
  }
}

/**
 * Fetch all research snapshots for a user ordered chronologically.
 */
export async function getUserSnapshots(userId) {
  if (!userId || process.env.ENABLE_RESEARCH_SNAPSHOTS === "false") {
    return [];
  }

  try {
    const params = {
      TableName: researchSnapshotsTable,
      IndexName: "UserSnapshotsIndex",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
      ScanIndexForward: false, // newest first
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    if (
      error.name === "ResourceNotFoundException" ||
      error.message?.includes("index")
    ) {
      return [];
    }
    console.warn("⚠️ [DDBSnapshot] UserSnapshots lookup failed:", error.message);
    return [];
  }
}

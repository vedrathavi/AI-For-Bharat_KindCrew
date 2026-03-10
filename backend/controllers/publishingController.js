import publishingService from "../services/publishing.service.js";

/**
 * POST /schedule/create
 */
export const createEvent = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await publishingService.createEvent(
      userId,
      req.body,
      req.userEmail,
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("createEvent error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * GET /schedule/events
 */
export const getEvents = async (req, res) => {
  try {
    const userId = req.userId;
    const items = await publishingService.getEvents(userId);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error("getEvents error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /schedule/:eventId
 */
export const getEvent = async (req, res) => {
  try {
    const userId = req.userId;
    const { eventId } = req.params;
    const item = await publishingService.getEvent(userId, eventId);
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error("getEvent error:", error);
    res.status(404).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /schedule/update
 */
export const updateEvent = async (req, res) => {
  try {
    const userId = req.userId;
    const { eventId, ...updates } = req.body;
    if (!eventId)
      return res
        .status(400)
        .json({ success: false, error: "eventId is required" });
    const updated = await publishingService.updateEvent(
      userId,
      eventId,
      updates,
      req.userEmail,
    );
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateEvent error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /schedule/:eventId
 */
export const deleteEvent = async (req, res) => {
  try {
    const userId = req.userId;
    const { eventId } = req.params;
    await publishingService.deleteEvent(userId, eventId, req.userEmail);
    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("deleteEvent error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /schedule/suggest-time
 * Uses Bedrock AI + optional creator profile context
 */
import dynamoDBService from "../services/dynamodb.service.js";

export const suggestTime = async (req, res) => {
  try {
    const userId = req.userId;
    let profileCtx = {};
    try {
      const profile = await dynamoDBService.getCreatorProfileByUserId(userId);
      if (profile) {
        profileCtx = {
          audience:
            profile.audience?.targetAudience ||
            profile.niche?.primary ||
            "general",
          creatorLevel: profile.creatorLevel || "beginner",
        };
      }
    } catch (_) {
      // profile lookup is best-effort
    }
    const result = await publishingService.suggestTime({
      platform: req.body.platform,
      topic: req.body.topic,
      timezone: req.body.timezone || "Asia/Kolkata",
      ...profileCtx,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("suggestTime error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

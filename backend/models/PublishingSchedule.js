/**
 * PublishingSchedule Model
 * Represents a scheduled post (Phase 3)
 * Table key: userId (PK) + eventId (SK)
 */

class PublishingSchedule {
  /**
   * Create a new schedule object with defaults
   * @param {string} eventId
   * @param {Object} data
   */
  static create(eventId, data) {
    const now = new Date().toISOString();

    return {
      userId: data.userId,
      eventId,

      // Source: "generated" (from Phase 2) or "manual"
      source: data.source || "manual",

      // contentId only for source=generated
      contentId: data.contentId || null,

      platform: data.platform,

      // Snapshot of content at scheduling time so edits don't break events
      contentSnapshot: data.contentSnapshot || {
        title: data.title || null,
        text: data.contentText || null,
      },

      // scheduledAt stored in UTC ISO
      scheduledAt: data.scheduledAt,
      timezone: data.timezone || "Asia/Kolkata",

      status: data.status || "scheduled",

      notification: {
        emailSent: false,
        ...data.notification,
      },

      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Validate schedule payload before saving
   * @param {Object} data
   * @returns {{valid: boolean, errors: string[]}}
   */
  static validate(data) {
    const errors = [];

    if (!data.userId || typeof data.userId !== "string") {
      errors.push("userId is required");
    }
    if (data.source === "generated" && !data.contentId) {
      errors.push("contentId is required for generated content");
    }
    if (!data.platform || typeof data.platform !== "string") {
      errors.push("platform is required");
    }
    if (!data.scheduledAt) {
      errors.push("scheduledAt is required");
    }
    if (data.scheduledAt && isNaN(new Date(data.scheduledAt).getTime())) {
      errors.push("scheduledAt must be a valid ISO date");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default PublishingSchedule;

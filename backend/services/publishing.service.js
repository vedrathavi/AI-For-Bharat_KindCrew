/**
 * Publishing Service (Phase 3)
 * Handles schedule creation, retrieval, update, deletion,
 * AI suggested posting times, and reminder dispatch.
 */

import { v4 as uuidv4 } from "uuid";
import dynamoDBService from "./dynamodb.service.js";
import PublishingSchedule from "../models/PublishingSchedule.js";
import {
  createScheduleRule,
  deleteScheduleRule,
} from "./eventbridge.service.js";
import {
  sendScheduleCancellation,
  sendScheduleConfirmation,
  sendScheduleReminder,
} from "./ses.service.js";
import { generateText } from "./bedrock.service.js";

class PublishingService {
  /**
   * Create a new scheduled event.
   * Accepts source="generated" (contentId required) or source="manual".
   */
  async createEvent(userId, payload, userEmail) {
    const eventId = uuidv4();
    const scheduledAt = this._toUTC(
      payload.scheduledDate,
      payload.scheduledTime,
      payload.timezone,
    );

    const scheduleData = PublishingSchedule.create(eventId, {
      userId,
      source: payload.source || "manual",
      contentId: payload.contentId || null,
      platform: payload.platform,
      contentSnapshot: payload.contentSnapshot || {
        title: payload.title || null,
        text: payload.contentText || null,
      },
      scheduledAt,
      timezone: payload.timezone || "Asia/Kolkata",
      status: "scheduled",
      notification: { emailSent: false },
    });

    const validation = PublishingSchedule.validate(scheduleData);
    if (!validation.valid) {
      throw new Error(`Invalid schedule: ${validation.errors.join(", ")}`);
    }

    const result = await dynamoDBService.createScheduledPost(scheduleData);

    // Fire-and-forget rule creation so schedule save is not blocked by infra hiccups.
    createScheduleRule({ eventId, userId, userEmail, scheduledAt }).catch(
      (err) => console.error("EventBridge rule creation failed:", err.message),
    );

    // Fire-and-forget confirmation mail when schedule is created.
    if (userEmail) {
      sendScheduleConfirmation({
        to: userEmail,
        platform: scheduleData.platform,
        scheduledAt: scheduleData.scheduledAt,
        timezone: scheduleData.timezone,
        title: scheduleData.contentSnapshot?.title,
        source: scheduleData.source,
      }).catch((err) =>
        console.error(
          "Schedule confirmation email failed:",
          err.name || err.message,
          err.message,
        ),
      );
    }

    return result;
  }

  /** Get all events for a user */
  async getEvents(userId) {
    return dynamoDBService.getScheduledPostsByUser(userId);
  }

  /** Get a single event */
  async getEvent(userId, eventId) {
    const item = await dynamoDBService.getScheduledPost(userId, eventId);
    if (!item) throw new Error("Event not found");
    return item;
  }

  /**
   * Partial update. If scheduling fields change, recompute UTC time and recreate EventBridge rule.
   */
  async updateEvent(userId, eventId, updates, userEmail) {
    if (updates.scheduledDate || updates.scheduledTime || updates.timezone) {
      const existing = await dynamoDBService.getScheduledPost(userId, eventId);
      if (!existing) throw new Error("Event not found");

      const date = updates.scheduledDate || existing.scheduledAt.slice(0, 10);
      const time = updates.scheduledTime || existing.scheduledAt.slice(11, 16);
      const tz = updates.timezone || existing.timezone;

      updates.scheduledAt = this._toUTC(date, time, tz);
      delete updates.scheduledDate;
      delete updates.scheduledTime;

      deleteScheduleRule(eventId).catch(() => {});
      createScheduleRule({
        eventId,
        userId,
        userEmail,
        scheduledAt: updates.scheduledAt,
      }).catch((err) =>
        console.error("EventBridge reschedule failed:", err.message),
      );
    }

    return dynamoDBService.updateScheduledPost(userId, eventId, updates);
  }

  /** Cancel and remove event */
  async deleteEvent(userId, eventId, userEmail) {
    const existing = await dynamoDBService.getScheduledPost(userId, eventId);
    if (!existing) throw new Error("Event not found");

    await dynamoDBService.deleteScheduledPost(userId, eventId);
    deleteScheduleRule(eventId).catch(() => {});

    if (userEmail) {
      sendScheduleCancellation({
        to: userEmail,
        platform: existing.platform,
        scheduledAt: existing.scheduledAt,
        timezone: existing.timezone,
        title: existing.contentSnapshot?.title,
      }).catch((err) =>
        console.error(
          "Schedule cancellation email failed:",
          err.name || err.message,
          err.message,
        ),
      );
    }
  }

  /**
   * AI-powered suggest posting time using Bedrock.
   */
  async suggestTime({ platform, audience, creatorLevel, timezone, topic }) {
    const modelId =
      process.env.BEDROCK_DEFAULT_MODEL || "amazon.nova-lite-v1:0";
    const platformGuide = {
      instagram:
        "Evenings (18:00–21:00) and Saturday/Sunday mornings perform best on Instagram.",
      linkedin:
        "Tuesday–Thursday 08:00–10:00 and 12:00–14:00 see peak professional engagement on LinkedIn.",
      twitter:
        "Weekday mornings 08:00–10:00 and around breaking-news hours (12:00, 17:00) work best on Twitter/X.",
      youtube:
        "Friday–Sunday 15:00–20:00 when viewers have leisure time drives the most YouTube watch-time.",
      facebook:
        "Wednesday 12:00–15:00 and Thursday–Friday 13:00–16:00 generate highest Facebook reach.",
      tiktok:
        "Tuesday–Friday 19:00–21:00 and weekend afternoons 14:00–16:00 dominate TikTok For You pages.",
      pinterest:
        "Saturday and Sunday 20:00–23:00 when users plan projects are prime Pinterest hours.",
    };
    const platformHint =
      platformGuide[platform?.toLowerCase()] ||
      `Analyse ${platform} audience behaviour to pick the best days and times.`;

    const prompt = `You are a data-driven social media strategist.

A creator needs the 3 best times to post on ${platform}.
Use the details below to give personalised, platform-specific suggestions.

Platform: ${platform}
Platform insight: ${platformHint}
Audience: ${audience || "general"}
Creator level: ${creatorLevel || "beginner"}
Timezone: ${timezone || "Asia/Kolkata"}
Content topic: ${topic || "general"}

IMPORTANT RULES:
- Suggestions MUST be tailored to ${platform} — do NOT copy generic weekday examples.
- Choose 3 DIFFERENT days that genuinely work best for ${platform}.
- Reasons must reference ${platform} behaviour, not generic advice.
- Vary the days — do not always pick Tuesday/Wednesday/Thursday.
- Keep each reason under 8 words of plain text.
- Time must be in HH:mm 24-hour format.

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "suggestedTimes": [
    { "day": "<best day for ${platform}>", "time": "<HH:mm>", "reason": "<why this day+time on ${platform}>" },
    { "day": "<2nd best day>", "time": "<HH:mm>", "reason": "<platform-specific reason>" },
    { "day": "<3rd best day>", "time": "<HH:mm>", "reason": "<platform-specific reason>" }
  ]
}`;

    try {
      const response = await generateText(prompt, modelId);
      const raw = response.content.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in AI response");
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.warn("AI suggest time fallback:", err.message);
      // Platform-specific fallback times so the fallback is also meaningful
      const fallbacks = {
        instagram: [
          {
            day: "Saturday",
            time: "18:00",
            reason: "Peak weekend evening scrolling",
          },
          {
            day: "Sunday",
            time: "10:00",
            reason: "Relaxed morning browse time",
          },
          {
            day: "Wednesday",
            time: "19:00",
            reason: "Mid-week wind-down engagement",
          },
        ],
        linkedin: [
          {
            day: "Tuesday",
            time: "08:30",
            reason: "Early professional feed check-in",
          },
          {
            day: "Wednesday",
            time: "12:00",
            reason: "Lunch break professional scroll",
          },
          {
            day: "Thursday",
            time: "09:00",
            reason: "Prime B2B decision-making hours",
          },
        ],
        twitter: [
          {
            day: "Monday",
            time: "08:00",
            reason: "News-hungry Monday morning scroll",
          },
          {
            day: "Wednesday",
            time: "12:00",
            reason: "Breaking-news lunch window",
          },
          {
            day: "Friday",
            time: "17:00",
            reason: "End-of-week trending engagement",
          },
        ],
        youtube: [
          {
            day: "Friday",
            time: "17:00",
            reason: "Weekend leisure viewing starts",
          },
          {
            day: "Saturday",
            time: "15:00",
            reason: "Peak Saturday watch-time hours",
          },
          {
            day: "Sunday",
            time: "16:00",
            reason: "Relaxed Sunday binge window",
          },
        ],
        tiktok: [
          {
            day: "Tuesday",
            time: "19:00",
            reason: "Weeknight For You page prime time",
          },
          {
            day: "Saturday",
            time: "14:00",
            reason: "Afternoon entertainment scrolling",
          },
          {
            day: "Sunday",
            time: "20:00",
            reason: "Sunday evening viral window",
          },
        ],
      };
      const key = platform?.toLowerCase().replace(/[^a-z]/g, "");
      return {
        suggestedTimes: fallbacks[key] || [
          {
            day: "Tuesday",
            time: "10:00",
            reason: "High professional browsing window",
          },
          {
            day: "Thursday",
            time: "19:00",
            reason: "Evening engagement spike",
          },
          {
            day: "Saturday",
            time: "11:00",
            reason: "Weekend morning audience peak",
          },
        ],
      };
    }
  }

  /**
   * Send reminder email and mark emailSent=true.
   * Intended to be invoked by a scheduler Lambda.
   */
  async sendReminder(userId, eventId, userEmail) {
    const event = await dynamoDBService.getScheduledPost(userId, eventId);
    if (!event) throw new Error("Event not found");

    await sendScheduleReminder({
      to: userEmail,
      platform: event.platform,
      scheduledAt: event.scheduledAt,
      timezone: event.timezone,
      title: event.contentSnapshot?.title,
      contentPreview: event.contentSnapshot?.text,
    });

    await dynamoDBService.updateScheduledPost(userId, eventId, {
      status: "completed",
      notification: { emailSent: true },
    });
  }

  /** Convert local date+time in a given timezone to UTC ISO string. */
  _toUTC(date, time, tz) {
    if (!date || !time) {
      throw new Error("scheduledDate and scheduledTime are required");
    }

    try {
      const [year, month, day] = date.split("-").map((v) => Number(v));
      const [hour, minute] = time.split(":").map((v) => Number(v));
      const timeZone = tz || "Asia/Kolkata";

      if (
        [year, month, day, hour, minute].some((v) => Number.isNaN(v))
      ) {
        throw new Error("Invalid date/time format");
      }

      // Start from a UTC guess then correct it by comparing rendered TZ parts.
      const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      });

      const parts = formatter.formatToParts(new Date(utcGuess));
      const value = (type) =>
        Number(parts.find((part) => part.type === type)?.value || "0");

      const renderedAsUtc = Date.UTC(
        value("year"),
        value("month") - 1,
        value("day"),
        value("hour"),
        value("minute"),
        value("second"),
      );
      const intendedAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
      const correctedUtc = utcGuess + (intendedAsUtc - renderedAsUtc);

      return new Date(correctedUtc).toISOString();
    } catch {
      return new Date(`${date}T${time}:00Z`).toISOString();
    }
  }
}

export default new PublishingService();

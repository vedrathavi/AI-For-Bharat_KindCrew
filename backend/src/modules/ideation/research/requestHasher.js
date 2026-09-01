import crypto from "crypto";

/**
 * Normalize a text string by lowercasing, trimming, and stripping excess whitespace & punctuation.
 */
export function normalizeQuery(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ");
}

/**
 * Generate a SHA-256 hash of the CreatorProfile context.
 * Any material change to the profile (niche, pillars, goal, avoidTopics, competitors)
 * changes this hash, invalidating research cache keys.
 */
export function generateCreatorContextHash(profile) {
  if (!profile) {
    return crypto.createHash("sha256").update("default_profile").digest("hex").slice(0, 16);
  }

  const nichePrimary = normalizeQuery(profile.niche?.primary || "General");
  const nicheSecondary = normalizeQuery(profile.niche?.secondary || "");
  const contentPillars = Array.isArray(profile.strategy?.contentPillars)
    ? [...profile.strategy.contentPillars].map(normalizeQuery).sort().join(",")
    : "";
  const primaryGoal = normalizeQuery(profile.goals?.primaryGoal || "growth");
  const avoidTopics = Array.isArray(profile.preferences?.avoidTopics)
    ? [...profile.preferences.avoidTopics].map(normalizeQuery).sort().join(",")
    : "";
  const competitorIds = Array.isArray(profile.competitors)
    ? [...profile.competitors]
        .map((c) => normalizeQuery(c.competitorId || c.name || c.url || ""))
        .filter(Boolean)
        .sort()
        .join(",")
    : "";

  const payload = [
    nichePrimary,
    nicheSecondary,
    contentPillars,
    primaryGoal,
    avoidTopics,
    competitorIds,
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/**
 * Generate a deterministic requestHash for research caching.
 * Same query + audience + platform + creatorContextHash + versions = SAME hash.
 */
export function generateRequestHash({
  topic,
  audience,
  platform,
  creatorProfile = null,
  enableLiveWebSearch = false,
  schemaVersion = "1.0",
  promptVersion = "1.0",
  scoringVersion = "2.0",
}) {
  const topicNorm = normalizeQuery(topic);
  const audienceNorm = normalizeQuery(audience);
  const platformNorm = normalizeQuery(platform);
  const contextHash = generateCreatorContextHash(creatorProfile);
  const webSearchFlag = enableLiveWebSearch ? "web1" : "web0";

  const payload = [
    topicNorm,
    audienceNorm,
    platformNorm,
    contextHash,
    webSearchFlag,
    schemaVersion,
    promptVersion,
    scoringVersion,
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

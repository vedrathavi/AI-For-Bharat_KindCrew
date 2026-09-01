import { getTrendingTopics, analyzeTrendCompetition } from "../../../../../services/googleTrendsService.js";
import { TrendSignalSchema } from "../../schemas/ideation.schemas.js";

const TIMEOUT_MS = 10000;

function withTimeout(promise, timeoutMs = TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("TrendProvider request timed out")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

/**
 * TrendSignalProvider
 * Circuit-breaker wrapped Google Trends signal fetcher.
 */
export class TrendSignalProvider {
  async getTrendSignal(keyword) {
    const normalizedKeyword = String(keyword || "").trim();
    if (!normalizedKeyword) return null;

    const now = new Date().toISOString();

    try {
      const timelineData = await withTimeout(getTrendingTopics(normalizedKeyword));

      if (!Array.isArray(timelineData) || timelineData.length === 0) {
        return null;
      }

      const values = timelineData.map((d) => parseInt(d.value?.[0] || d.value || "0", 10)).filter((v) => !isNaN(v));
      const avgInterest = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
      const peakInterest = values.length > 0 ? Math.max(...values) : 0;

      let recentTrend = "stable";
      if (values.length >= 4) {
        const recentHalf = values.slice(-Math.floor(values.length / 2));
        const olderHalf = values.slice(0, Math.floor(values.length / 2));
        const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
        const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length;
        if (recentAvg > olderAvg * 1.15) recentTrend = "rising";
        else if (recentAvg < olderAvg * 0.85) recentTrend = "falling";
      }

      const competitionScore = analyzeTrendCompetition(timelineData);

      return TrendSignalSchema.parse({
        keyword: normalizedKeyword,
        status: "available",
        avgInterest,
        peakInterest,
        recentTrend,
        competitionScore,
        source: "google-trends",
        retrievedAt: now,
        cached: false,
      });
    } catch (error) {
      console.warn("⚠️ [TrendSignalProvider] Circuit breaker triggered:", error.message);
      return TrendSignalSchema.parse({
        keyword: normalizedKeyword,
        status: "unavailable",
        avgInterest: null,
        peakInterest: null,
        recentTrend: null,
        competitionScore: null,
        reason: error.message || "provider_unavailable",
        source: "google-trends",
        retrievedAt: now,
        cached: false,
      });
    }
  }
}

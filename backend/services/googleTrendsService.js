import googleTrends from "google-trends-api";

/**
 * Get trending topics and interest data
 */
async function getTrendingTopics(keyword, timeframe = "now 1-m") {
  try {
    const results = await googleTrends.interestByTime({
      keyword: keyword,
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      granularTimeUnit: "day",
    });

    const parsed = JSON.parse(results);
    return parsed.default.timelineData || [];
  } catch (error) {
    console.error("Google Trends error:", error.message);
    return [];
  }
}

/**
 * Get related queries for a keyword
 */
async function getRelatedQueries(keyword) {
  try {
    const results = await googleTrends.relatedQueries({
      keyword: keyword,
    });

    const parsed = JSON.parse(results);
    return parsed.default.rankedList || [];
  } catch (error) {
    console.error("Related queries error:", error.message);
    return [];
  }
}

/**
 * Analyze trend data for competition level
 * Higher trend = higher competition
 */
function analyzeTrendCompetition(trendData) {
  if (!trendData || trendData.length === 0) return 3; // Low competition

  const avgValue =
    trendData.reduce((sum, d) => sum + parseInt(d.value || 0), 0) /
    trendData.length;

  if (avgValue > 70) return 8; // Very high competition
  if (avgValue > 50) return 7;
  if (avgValue > 30) return 5;
  if (avgValue > 10) return 4;
  return 3; // Low competition
}

export { getTrendingTopics, getRelatedQueries, analyzeTrendCompetition };

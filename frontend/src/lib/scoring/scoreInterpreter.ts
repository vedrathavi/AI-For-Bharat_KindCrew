import { IdeaScore } from "@/types/research";

export interface ScoreInterpretation {
  label: string;
  badgeColor: string;
  summary: string;
  whyItWorks: string;
  watchOutFor: string;
}

const HUMAN_DIMENSION_PROSE: Record<string, { high: string; mid: string; low: string }> = {
  audienceDemand: {
    high: "Strong, active audience interest across current market discussions.",
    mid: "People are actively discussing this topic, though demand is steady rather than peaking.",
    low: "Search and discussion interest around this specific topic is currently niche.",
  },
  trendMomentum: {
    high: "Search momentum is accelerating rapidly right now.",
    mid: "Search momentum is steady and reliable.",
    low: "Search momentum has cooled down recently.",
  },
  creatorFit: {
    high: "Directly aligns with your primary content pillars and target persona.",
    mid: "Matches your general niche and audience goals well.",
    low: "Slightly outside your core content pillars, requiring extra context.",
  },
  contentGap: {
    high: "Addresses a clear, underserved gap where current creator coverage is weak.",
    mid: "Fills a distinct audience sub-topic that isn't fully saturated.",
    low: "This topic has been broadly covered, so your specific hook is critical.",
  },
  differentiation: {
    high: "Presents a highly unique, counter-intuitive thesis that stands out.",
    mid: "Offers a clear strategic perspective distinct from standard advice.",
    low: "The angle is fairly standard; sharpening the hook will help it stand out.",
  },
  novelty: {
    high: "Completely fresh concept compared to your previously published content.",
    mid: "Distinct angle framing relative to your recent posts.",
    low: "Similar to a topic you've previously published; focus on the new thesis.",
  },
  competition: {
    high: "Very low creator competition gives you maximum room to own the space.",
    mid: "Moderate competition exists; a crisp hook will capture attention.",
    low: "Heavy creator competition; execution needs a strong unique hook.",
  },
  platformFit: {
    high: "Format and structure perfectly match best practices for this platform.",
    mid: "Well-suited for this platform's primary audience consumption habits.",
    low: "Consider adapting the format slightly to fit platform norms.",
  },
  feasibility: {
    high: "Straightforward to produce efficiently at your current creator level.",
    mid: "Feasible production complexity with clear execution steps.",
    low: "Requires multi-step scripting or extra production effort.",
  },
  evidenceStrength: {
    high: "Backed by multiple high-relevance verified market search sources.",
    mid: "Supported by solid web signals and market discussion context.",
    low: "Signals are baseline; consider validating with a quick audience poll.",
  },
};

/**
 * Get human-readable prose for an individual dimension score.
 */
export function getHumanDimensionExplanation(key: string, score: number, fallbackExplanation = ""): string {
  const proseMap = HUMAN_DIMENSION_PROSE[key];
  if (!proseMap) return fallbackExplanation;

  if (score >= 7.5) return proseMap.high;
  if (score >= 5.0) return proseMap.mid;
  return proseMap.low;
}

/**
 * Deterministically interpret an IdeaScore into human-readable insights.
 */
export function interpretScore(scores?: IdeaScore | any): ScoreInterpretation {
  const overall = typeof scores?.opportunityScore === "number"
    ? scores.opportunityScore
    : typeof scores?.overall === "number"
    ? scores.overall
    : 7.5;

  let label = "Promising Opportunity";
  let badgeColor = "text-amber-400 bg-amber-950/60 border-amber-800/60";

  if (overall >= 9.0) {
    label = "Exceptional Opportunity";
    badgeColor = "text-emerald-400 bg-emerald-950/60 border-emerald-800/60";
  } else if (overall >= 8.0) {
    label = "Strong Opportunity";
    badgeColor = "text-emerald-400 bg-emerald-950/60 border-emerald-800/60";
  } else if (overall >= 7.0) {
    label = "Promising Opportunity";
    badgeColor = "text-amber-400 bg-amber-950/60 border-amber-800/60";
  } else if (overall >= 6.0) {
    label = "Moderate Opportunity";
    badgeColor = "text-zinc-300 bg-zinc-900 border-zinc-700";
  } else {
    label = "Weak Opportunity";
    badgeColor = "text-rose-400 bg-rose-950/60 border-rose-800/60";
  }

  // Find top strength and primary watch-out from dimensions
  let topStrength = "";
  let watchOut = "";

  if (scores?.dimensions && typeof scores.dimensions === "object") {
    const entries = Object.entries(scores.dimensions) as [string, { score: number; explanation: string }][];
    entries.sort((a, b) => b[1].score - a[1].score);

    const highest = entries[0];
    const lowest = entries[entries.length - 1];

    if (highest) {
      topStrength = getHumanDimensionExplanation(highest[0], highest[1].score, highest[1].explanation);
    }
    if (lowest && lowest[1].score < 7.0) {
      watchOut = getHumanDimensionExplanation(lowest[0], lowest[1].score, lowest[1].explanation);
    }
  }

  if (!topStrength) {
    topStrength = "Combines solid differentiation with strong alignment for your target audience.";
  }
  if (!watchOut) {
    watchOut = "Competition is moderate, so ensure your opening hook gets straight to the core value.";
  }

  const summary = `This idea scores ${overall.toFixed(1)}/10 because it ${topStrength.toLowerCase()}`;

  return {
    label,
    badgeColor,
    summary,
    whyItWorks: topStrength,
    watchOutFor: watchOut,
  };
}

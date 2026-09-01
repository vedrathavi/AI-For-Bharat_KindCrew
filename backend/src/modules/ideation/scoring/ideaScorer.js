import { calculateNoveltyScore } from "./noveltyScorer.js";
import { IdeaScoreSchema } from "../schemas/ideation.schemas.js";

function clamp(val, min = 0, max = 10) {
  return Math.min(max, Math.max(min, val));
}

function toOneDecimal(val) {
  return parseFloat(clamp(val).toFixed(1));
}

/**
 * Helper to match cited source ID against verified source ID.
 * Prefers exact equality.
 * Supports legacy suffixed source IDs (e.g. src_1_oldhash <-> src_1) without numeric collisions (src_1 !== src_10).
 */
export function sourceIdsMatch(citedId, sourceId) {
  if (!citedId || !sourceId) return false;
  const strA = String(citedId).trim();
  const strB = String(sourceId).trim();
  if (strA === strB) return true;

  // Extract base ID (e.g., "src_1" from "src_1_abc12")
  const baseMatchA = strA.match(/^(src_\d+)(?:_[a-z0-9]+)?$/i);
  const baseMatchB = strB.match(/^(src_\d+)(?:_[a-z0-9]+)?$/i);

  if (baseMatchA && baseMatchB) {
    return baseMatchA[1].toLowerCase() === baseMatchB[1].toLowerCase();
  }

  return false;
}

/**
 * Candidate-Specific IdeaScorer v2.1
 * Evaluates candidate-specific evidence, differentiation, content gap, platform fit, and creator synergy.
 */
export function scoreOpportunity(opportunity, snapshot, creatorProfile = null, previousItems = []) {
  const { title, angle, format, platform, differentiation, targetPainPoint, contentGap: oppGap, evidencedBySourceIds } = opportunity;
  const trendSignal = snapshot?.trendSignal;
  const verifiedSources = snapshot?.verifiedSources || [];
  const corpusContentGaps = snapshot?.corpus?.contentGaps || [];
  const corpusKeywords = snapshot?.corpus?.keywords || [];
  const pillars = Array.isArray(creatorProfile?.strategy?.contentPillars)
    ? creatorProfile.strategy.contentPillars
    : [];

  // Match candidate's cited source IDs against snapshot's verified sources
  const citedSourceIds = Array.isArray(evidencedBySourceIds) ? evidencedBySourceIds : [];
  const candidateSources = verifiedSources.filter((src) =>
    citedSourceIds.some((citedId) => sourceIdsMatch(citedId, src.sourceId))
  );

  // 1. Evidence Strength (10%) - Candidate-Specific
  let evidenceVal = 2.0;
  let evidenceExplanation = "Synthesized with AI heuristics (live search disabled or no citations)";
  if (candidateSources.length >= 3) {
    const topDomains = candidateSources.slice(0, 3).map((s) => s.domain).filter(Boolean);
    evidenceVal = Math.min(10, 8.5 + (candidateSources.length - 3) * 0.5);
    evidenceExplanation = `Backed by ${candidateSources.length} verified candidate sources (${topDomains.join(", ")})`;
  } else if (candidateSources.length === 2) {
    evidenceVal = 8.0;
    evidenceExplanation = `Backed by 2 verified sources (${candidateSources.map((s) => s.domain).join(", ")})`;
  } else if (candidateSources.length === 1) {
    evidenceVal = 6.5;
    evidenceExplanation = `Backed by 1 verified source (${candidateSources[0].domain})`;
  } else if (verifiedSources.length > 0) {
    evidenceVal = 3.5;
    evidenceExplanation = "Derived from overall topic corpus without direct candidate citation IDs";
  }

  const evidenceStrength = {
    score: toOneDecimal(evidenceVal),
    explanation: evidenceExplanation,
    sourceSignals: candidateSources.length > 0
      ? candidateSources.map((s) => `Source citation: ${s.domain} (${s.sourceId})`)
      : verifiedSources.length > 0
      ? [`Corpus sources available: ${verifiedSources.length}`]
      : ["AI synthesis heuristics"],
  };

  // 2. Audience Demand (15%)
  let demandVal = 5.0;
  let demandExplanation = "Baseline audience demand estimate";
  if (trendSignal?.status === "available" && trendSignal?.avgInterest != null) {
    demandVal = (trendSignal.avgInterest / 100) * 10;
    demandExplanation = `Search interest index: ${trendSignal.avgInterest}/100`;
  } else if (candidateSources.length > 0) {
    const avgSourceScore = candidateSources.reduce((s, src) => s + (src.score || src.relevanceScore || 0.6), 0) / candidateSources.length;
    demandVal = Math.min(10, 5.0 + avgSourceScore * 5.0);
    demandExplanation = `Validated by ${candidateSources.length} cited market sources with high relevance`;
  } else if (verifiedSources.length > 0) {
    demandVal = 6.0;
    demandExplanation = `Verified topic discussions in ${verifiedSources.length} web sources`;
  }

  // Check candidate keyword overlap with high-importance corpus keywords
  const candidateKeywords = Array.isArray(opportunity.targetedKeywords) ? opportunity.targetedKeywords : [];
  const highImpKeywords = corpusKeywords.filter((k) => k.importance === "high").map((k) => k.term.toLowerCase());
  const keywordMatchCount = candidateKeywords.filter((k) => {
    const term = typeof k === "string" ? k.toLowerCase() : (k.term || "").toLowerCase();
    return highImpKeywords.includes(term);
  }).length;

  if (keywordMatchCount > 0) {
    demandVal = Math.min(10, demandVal + keywordMatchCount * 0.5);
  }

  const audienceDemand = {
    score: toOneDecimal(demandVal),
    explanation: demandExplanation,
    sourceSignals: [
      trendSignal?.status === "available" && trendSignal?.avgInterest != null
        ? `Google Trends interest: ${trendSignal.avgInterest}`
        : `Cited sources: ${candidateSources.length} / Total: ${verifiedSources.length}`,
    ],
  };

  // 3. Trend Momentum (10%)
  const hasTrends = trendSignal?.status === "available" && trendSignal?.recentTrend != null;
  let momentumVal = 4.0;
  let momentumText = "Google Trends data unavailable";
  if (hasTrends) {
    if (trendSignal.recentTrend === "rising") {
      momentumVal = 9.5;
      momentumText = "Rising search volume trajectory";
    } else if (trendSignal.recentTrend === "falling") {
      momentumVal = 3.5;
      momentumText = "Declining search momentum";
    } else {
      momentumVal = 6.5;
      momentumText = "Stable search volume trajectory";
    }
  }

  const trendMomentum = {
    score: toOneDecimal(momentumVal),
    explanation: momentumText,
    sourceSignals: [hasTrends ? `Trend direction: ${trendSignal.recentTrend}` : "Google Trends unavailable"],
  };

  // 4. Creator Fit (15%) - Candidate-Specific
  let fitVal = 5.0;
  const combinedText = `${title || ""} ${angle || ""} ${targetPainPoint || ""} ${candidateKeywords.join(" ")}`.toLowerCase();
  const pillarMatches = pillars.filter((p) => combinedText.includes(p.toLowerCase()));
  if (pillarMatches.length > 0) {
    fitVal = Math.min(10, 6.5 + pillarMatches.length * 1.5);
  } else if (creatorProfile?.niche?.primary && combinedText.includes(creatorProfile.niche.primary.toLowerCase())) {
    fitVal = 7.5;
  }
  const creatorFit = {
    score: toOneDecimal(fitVal),
    explanation: pillarMatches.length > 0
      ? `Matches content pillars: ${pillarMatches.join(", ")}`
      : creatorProfile?.niche?.primary
      ? `Aligned with creator niche: ${creatorProfile.niche.primary}`
      : "General creator audience fit",
    sourceSignals: pillarMatches.length > 0 ? pillarMatches.map((p) => `Pillar match: ${p}`) : ["General niche alignment"],
  };

  // 5. Content Gap (15%) - Candidate-Specific
  let gapVal = 4.5;
  let gapExplanation = "Standard market coverage without a distinct gap";
  if (oppGap && oppGap.length > 25) {
    gapVal = candidateSources.length > 0 ? 9.0 : 8.0;
    gapExplanation = `Fills candidate angle gap: "${oppGap.slice(0, 80)}"`;
  } else if (corpusContentGaps.length > 0) {
    gapVal = 7.0;
    gapExplanation = `Addresses market gap: "${(corpusContentGaps[0].description || corpusContentGaps[0]).slice(0, 80)}"`;
  }
  const contentGap = {
    score: toOneDecimal(gapVal),
    explanation: gapExplanation,
    sourceSignals: [oppGap || (corpusContentGaps.length > 0 ? "Market gap identified" : "Standard coverage")],
  };

  // 6. Differentiation (10%) - Candidate-Specific
  let diffVal = 4.5;
  if (differentiation && differentiation.length > 30) {
    diffVal = 8.5;
  } else if (differentiation && differentiation.length > 15) {
    diffVal = 7.0;
  }
  if (opportunity.whyThisAngleMatters && opportunity.whyThisAngleMatters.length > 20) {
    diffVal = Math.min(10, diffVal + 0.8);
  }
  const diffDimension = {
    score: toOneDecimal(diffVal),
    explanation: differentiation || "Standard angle positioning",
    sourceSignals: ["Angle positioning strength"],
  };

  // 7. Novelty (10%) - Candidate-Specific
  const noveltyResult = calculateNoveltyScore(title, angle, previousItems);
  const novelty = {
    score: toOneDecimal(noveltyResult.score),
    explanation: noveltyResult.explanation,
    sourceSignals: noveltyResult.sourceSignals,
  };

  // 8. Competition (10%)
  let compVal = 5.0;
  let compExplanation = "Baseline competitive landscape (unverified)";
  if (trendSignal?.status === "available" && trendSignal?.competitionScore != null) {
    compVal = 11 - trendSignal.competitionScore; // invert: lower competition = higher score
    if (diffVal >= 8.0) compVal = Math.min(10, compVal + 1.0); // differentiation defense bonus
    compExplanation = `Competitive saturation index: ${toOneDecimal(10 - compVal)}/10`;
  } else if (diffVal >= 8.0) {
    compVal = 6.5;
    compExplanation = "High angle differentiation creates positioning defense";
  }
  const competition = {
    score: toOneDecimal(compVal),
    explanation: compExplanation,
    sourceSignals: [
      trendSignal?.status === "available" && trendSignal?.competitionScore != null
        ? `Competition index: ${trendSignal.competitionScore}`
        : "Standard competition estimate",
    ],
  };

  // 9. Platform Fit (10%) - Candidate-Specific
  let platformVal = 7.0;
  const pNorm = (platform || "").toLowerCase();
  const fNorm = (format || "").toLowerCase();
  if (pNorm === "linkedin" && (fNorm.includes("carousel") || fNorm.includes("post") || fNorm.includes("how-to") || fNorm.includes("framework"))) platformVal = 9.2;
  else if (pNorm === "youtube" && (fNorm.includes("video") || fNorm.includes("script") || fNorm.includes("tutorial") || fNorm.includes("explainer") || fNorm.includes("breakdown"))) platformVal = 9.5;
  else if (pNorm === "twitter" && (fNorm.includes("thread") || fNorm.includes("post") || fNorm.includes("breakdown") || fNorm.includes("takeaways"))) platformVal = 9.2;
  else if (pNorm === "instagram" && (fNorm.includes("reel") || fNorm.includes("carousel") || fNorm.includes("infographic"))) platformVal = 9.2;
  else if (pNorm) platformVal = 8.0;

  const platformFit = {
    score: toOneDecimal(platformVal),
    explanation: `Format "${format || "post"}" matches platform "${platform || "general"}" norms`,
    sourceSignals: [`Platform format match: ${platform}/${format}`],
  };

  // 10. Feasibility (5%) - Candidate-Specific
  let featVal = 8.5;
  const level = creatorProfile?.goals?.creatorLevel || "intermediate";
  if (level === "beginner" && fNorm.includes("video")) featVal = 6.5;
  const feasibility = {
    score: toOneDecimal(featVal),
    explanation: `Feasible for ${level} creator production level`,
    sourceSignals: [`Creator level: ${level}`],
  };

  // Weighted overall calculation
  const weightedSum =
    audienceDemand.score * 0.15 +
    trendMomentum.score * 0.10 +
    creatorFit.score * 0.15 +
    contentGap.score * 0.15 +
    diffDimension.score * 0.10 +
    novelty.score * 0.10 +
    competition.score * 0.10 +
    platformFit.score * 0.10 +
    feasibility.score * 0.05 +
    evidenceStrength.score * 0.10;

  const opportunityScore = toOneDecimal(weightedSum);
  const researchConfidence = parseFloat((snapshot?.researchConfidence || 0.5).toFixed(2));
  const trendConfidence = hasTrends ? 0.85 : 0.0;

  const resultScore = {
    overall: opportunityScore,
    opportunityScore,
    researchConfidence,
    trendConfidence,
    scoringVersion: "2.0",
    dimensions: {
      audienceDemand,
      trendMomentum,
      creatorFit,
      contentGap,
      differentiation: diffDimension,
      novelty,
      competition,
      platformFit,
      feasibility,
      evidenceStrength,
    },
  };

  return IdeaScoreSchema.parse(resultScore);
}

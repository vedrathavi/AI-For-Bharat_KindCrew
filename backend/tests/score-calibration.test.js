import test from "node:test";
import assert from "node:assert/strict";
import { scoreOpportunity } from "../src/modules/ideation/scoring/ideaScorer.js";

test("Section 2: Score Calibration Test (Case A > Case B > Case C > Case D, and Case E trend check)", () => {
  // Shared verified sources corpus
  const verifiedSources = [
    { sourceId: "src_1", score: 0.95, relevanceScore: 0.95, domain: "bbc.com", title: "BBC Report" },
    { sourceId: "src_2", score: 0.90, relevanceScore: 0.90, domain: "reuters.com", title: "Reuters Analysis" },
    { sourceId: "src_3", score: 0.85, relevanceScore: 0.85, domain: "techcrunch.com", title: "TechCrunch Feature" },
    { sourceId: "src_4", score: 0.80, relevanceScore: 0.80, domain: "nature.com", title: "Nature Study" },
  ];

  const profile = {
    niche: { primary: "Artificial Intelligence" },
    strategy: { contentPillars: ["Agentic Workflows", "Production LLMs"] },
    goals: { creatorLevel: "intermediate", primaryGoal: "growth" },
  };

  // -------------------------------------------------------------------------
  // CASE A: Excellent Opportunity
  // Strong current evidence (3 cited sources), rising trend (interest=85),
  // clear content gap, highly differentiated contrarian angle, high novelty, excellent format.
  // -------------------------------------------------------------------------
  const oppA = {
    title: "Deploying Autonomous Agent Workflows in Production Without Hallucination Traps",
    angle: "Production LLM Architecture Contrarian Breakdown",
    platform: "twitter",
    format: "thread",
    differentiation: "Step-by-step breakdown exposing why naive RAG loops fail in enterprise agentic setups and how deterministic state guards fix it.",
    targetPainPoint: "Engineering teams face catastrophic latency and unbounded recursive hallucination loops in multi-agent deployments.",
    contentGap: "Zero actionable guides exist showing deterministic verification state guards for multi-agent loops.",
    whyThisAngleMatters: "High enterprise failure rate in production agent adoption right now.",
    targetedKeywords: ["Production LLMs", "Agentic Workflows"],
    evidencedBySourceIds: ["src_1", "src_2", "src_3"],
  };

  const snapshotA = {
    trendSignal: { status: "available", avgInterest: 85, competitionScore: 4, recentTrend: "rising" },
    verifiedSources,
    corpus: {
      contentGaps: [{ description: "Enterprise multi-agent loop failure guide" }],
      keywords: [{ term: "Agentic Workflows", importance: "high" }],
    },
    researchConfidence: 0.85,
  };

  const scoreA = scoreOpportunity(oppA, snapshotA, profile, []);

  // -------------------------------------------------------------------------
  // CASE B: Good Opportunity
  // Strong evidence (2 cited sources), stable trend (interest=65), moderate gap, moderate differentiation.
  // -------------------------------------------------------------------------
  const oppB = {
    title: "5 Key Frameworks for Multi-Agent LLM Orchestration",
    angle: "Comparative Overview",
    platform: "twitter",
    format: "thread",
    differentiation: "Comprehensive comparison of modern open-source agent frameworks.",
    targetPainPoint: "Developers don't know which agent framework to choose for their project.",
    contentGap: "Objective comparison table comparing LangGraph, CrewAI, and AutoGen.",
    whyThisAngleMatters: "Framework landscape is evolving quickly.",
    targetedKeywords: ["Agentic Workflows"],
    evidencedBySourceIds: ["src_1", "src_2"],
  };

  const snapshotB = {
    trendSignal: { status: "available", avgInterest: 65, competitionScore: 6, recentTrend: "stable" },
    verifiedSources,
    corpus: {
      contentGaps: [{ description: "Framework comparison overview" }],
      keywords: [{ term: "Agentic Workflows", importance: "high" }],
    },
    researchConfidence: 0.75,
  };

  const scoreB = scoreOpportunity(oppB, snapshotB, profile, []);

  // -------------------------------------------------------------------------
  // CASE C: Saturated Opportunity
  // High search demand, but high competition (competitionScore=9), saturated topic, weak differentiation.
  // -------------------------------------------------------------------------
  const oppC = {
    title: "Top 10 AI Tools Everyone Is Using in 2026",
    angle: "Listicle Roundup",
    platform: "twitter",
    format: "post",
    differentiation: "General list of top AI productivity apps.",
    targetPainPoint: "Finding new AI tools.",
    contentGap: "General summary list.",
    whyThisAngleMatters: "Everyone searches for AI tools.",
    targetedKeywords: [],
    evidencedBySourceIds: ["src_1"],
  };

  const snapshotC = {
    trendSignal: { status: "available", avgInterest: 90, competitionScore: 9, recentTrend: "stable" },
    verifiedSources,
    corpus: {
      contentGaps: [],
      keywords: [],
    },
    researchConfidence: 0.65,
  };

  const scoreC = scoreOpportunity(oppC, snapshotC, profile, [
    { topic: "Top 10 AI Tools in 2025", angle: "Listicle" },
  ]);

  // -------------------------------------------------------------------------
  // CASE D: Weak Generic Idea
  // Weak evidence (0 cited sources), generic topic, no gap, poor differentiation.
  // -------------------------------------------------------------------------
  const oppD = {
    title: "Why Artificial Intelligence is Changing the Future of Work",
    angle: "Generic Essay",
    platform: "twitter",
    format: "post",
    differentiation: "AI is moving fast.",
    targetPainPoint: "People want to know what AI is.",
    contentGap: "Basic overview.",
    whyThisAngleMatters: "General technology topic.",
    targetedKeywords: [],
    evidencedBySourceIds: [],
  };

  const snapshotD = {
    trendSignal: { status: "available", avgInterest: 40, competitionScore: 8, recentTrend: "falling" },
    verifiedSources: [],
    corpus: {
      contentGaps: [],
      keywords: [],
    },
    researchConfidence: 0.3,
  };

  const scoreD = scoreOpportunity(oppD, snapshotD, profile, [
    { topic: "Why AI is changing the world", angle: "Generic Essay" },
  ]);

  // -------------------------------------------------------------------------
  // CASE E: No Trend Evidence
  // Strong web evidence (3 cited sources), but Google Trends is unavailable.
  // -------------------------------------------------------------------------
  const oppE = {
    title: "Deploying Autonomous Agent Workflows in Production Without Hallucination Traps",
    angle: "Production LLM Architecture Contrarian Breakdown",
    platform: "twitter",
    format: "thread",
    differentiation: "Step-by-step breakdown exposing why naive RAG loops fail in enterprise agentic setups.",
    targetPainPoint: "Engineering teams face catastrophic latency and unbounded recursive hallucination loops.",
    contentGap: "Zero actionable guides exist showing deterministic verification state guards.",
    whyThisAngleMatters: "High enterprise failure rate in production agent adoption.",
    targetedKeywords: ["Production LLMs"],
    evidencedBySourceIds: ["src_1", "src_2", "src_3"],
  };

  const snapshotE = {
    trendSignal: { status: "unavailable", avgInterest: null, recentTrend: null, competitionScore: null },
    verifiedSources,
    corpus: {
      contentGaps: [{ description: "Enterprise multi-agent loop failure guide" }],
      keywords: [{ term: "Production LLMs", importance: "high" }],
    },
    researchConfidence: 0.65,
  };

  const scoreE = scoreOpportunity(oppE, snapshotE, profile, []);

  // -------------------------------------------------------------------------
  // VERIFICATION OF SECTION 2 CONSTRAINTS
  // -------------------------------------------------------------------------
  console.log("\n================ [SCORE CALIBRATION TEST TRACE] ================");
  console.log(`CASE A (Excellent): Score = ${scoreA.opportunityScore} | Evidence = ${scoreA.dimensions.evidenceStrength.score} | Diff = ${scoreA.dimensions.differentiation.score}`);
  console.log(`CASE B (Good):      Score = ${scoreB.opportunityScore} | Evidence = ${scoreB.dimensions.evidenceStrength.score} | Diff = ${scoreB.dimensions.differentiation.score}`);
  console.log(`CASE C (Saturated): Score = ${scoreC.opportunityScore} | Evidence = ${scoreC.dimensions.evidenceStrength.score} | Comp = ${scoreC.dimensions.competition.score}`);
  console.log(`CASE D (Weak):      Score = ${scoreD.opportunityScore} | Evidence = ${scoreD.dimensions.evidenceStrength.score} | Diff = ${scoreD.dimensions.differentiation.score}`);
  console.log(`CASE E (No Trend):  Score = ${scoreE.opportunityScore} | TrendConfidence = ${scoreE.trendConfidence} | Momentum = "${scoreE.dimensions.trendMomentum.explanation}"`);
  console.log("=================================================================\n");

  // Assertion 1: A > B > C > D
  assert.ok(
    scoreA.opportunityScore > scoreB.opportunityScore,
    `Case A (${scoreA.opportunityScore}) must be greater than Case B (${scoreB.opportunityScore})`
  );
  assert.ok(
    scoreB.opportunityScore > scoreC.opportunityScore,
    `Case B (${scoreB.opportunityScore}) must be greater than Case C (${scoreC.opportunityScore})`
  );
  assert.ok(
    scoreC.opportunityScore > scoreD.opportunityScore,
    `Case C (${scoreC.opportunityScore}) must be greater than Case D (${scoreD.opportunityScore})`
  );

  // Assertion 2: Case E has trendConfidence === 0 and honest explanation
  assert.equal(scoreE.trendConfidence, 0, "Case E must have trendConfidence = 0");
  assert.equal(scoreE.dimensions.trendMomentum.explanation, "Google Trends data unavailable");
  assert.ok(scoreE.opportunityScore > 6.5, "Case E with strong web evidence retains solid score despite missing trends");
});

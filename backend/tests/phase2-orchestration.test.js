import test from "node:test";
import assert from "node:assert/strict";
import { scoreOpportunity } from "../src/modules/ideation/scoring/ideaScorer.js";
import { calculateNoveltyScore } from "../src/modules/ideation/scoring/noveltyScorer.js";

test("Phase 2: calculateNoveltyScore penalizes similar previous topics", () => {
  const previousItems = [
    { topic: "Top 5 AI Productivity Tools for Founders", angle: "Automation workflow" },
  ];

  const candidateSame = {
    title: "Top 5 AI Productivity Tools for Founders",
    angle: "Automation workflow",
  };

  const candidateFresh = {
    title: "How Early Stage Startups Hire First Engineers",
    angle: "Equity vs Salary framework",
  };

  const scoreSame = calculateNoveltyScore(candidateSame.title, candidateSame.angle, previousItems);
  const scoreFresh = calculateNoveltyScore(candidateFresh.title, candidateFresh.angle, previousItems);

  assert.ok(scoreFresh.score > scoreSame.score);
  assert.ok(scoreSame.score < 5.0);
  assert.ok(scoreFresh.score > 8.0);
});

test("Phase 2: scoreOpportunity returns 100% deterministic scores for identical input", () => {
  const opportunity = {
    title: "AI Tools for Video Repurposing",
    angle: "Save 10 hours per week editing clips",
    format: "carousel",
    platform: "linkedin",
    differentiation: "Counter-intuitive workflow step by step",
  };

  const snapshot = {
    trendSignal: { avgInterest: 50, competitionScore: 6, recentTrend: "rising" },
    verifiedSources: [{ score: 0.8 }, { score: 0.9 }],
    corpus: { contentGaps: [{ description: "Clip scoring gap" }] },
    researchConfidence: 0.85,
  };

  const profile = {
    niche: { primary: "AI" },
    strategy: { contentPillars: ["Repurposing", "Video"] },
    goals: { creatorLevel: "intermediate" },
  };

  const score1 = scoreOpportunity(opportunity, snapshot, profile, []);
  const score2 = scoreOpportunity(opportunity, snapshot, profile, []);

  assert.equal(score1.overall, score2.overall);
  assert.equal(score1.opportunityScore, score2.opportunityScore);
  assert.equal(score1.scoringVersion, "2.0");
  assert.equal(score1.researchConfidence, 0.85);
});

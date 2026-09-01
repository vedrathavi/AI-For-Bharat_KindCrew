import test from "node:test";
import assert from "node:assert/strict";
import { scoreOpportunity } from "../src/modules/ideation/scoring/ideaScorer.js";

test("Score Mapping: Every dimension maps to valid non-zero values when evidence is present", () => {
  const opportunity = {
    title: "AI Tools for Video Creators",
    angle: "Repurpose long podcasts into viral clips",
    format: "carousel",
    platform: "linkedin",
    differentiation: "Step by step automation guide",
  };

  const snapshot = {
    trendSignal: { avgInterest: 65, competitionScore: 5, recentTrend: "rising" },
    verifiedSources: [{ score: 0.9 }, { score: 0.85 }],
    corpus: { contentGaps: [{ description: "Clip scoring gap" }] },
    researchConfidence: 0.8,
  };

  const profile = {
    niche: { primary: "AI" },
    strategy: { contentPillars: ["Repurposing", "Video"] },
    goals: { creatorLevel: "intermediate" },
  };

  const scores = scoreOpportunity(opportunity, snapshot, profile, []);

  assert.equal(scores.scoringVersion, "2.0");
  assert.ok(typeof scores.overall === "number");
  assert.ok(scores.overall > 0);
  assert.equal(scores.overall, scores.opportunityScore);

  // Verify all 10 dimension objects exist and are > 0
  const dims = scores.dimensions;
  assert.ok(dims.audienceDemand.score > 0);
  assert.ok(dims.trendMomentum.score > 0);
  assert.ok(dims.creatorFit.score > 0);
  assert.ok(dims.contentGap.score > 0);
  assert.ok(dims.differentiation.score > 0);
  assert.ok(dims.novelty.score > 0);
  assert.ok(dims.competition.score > 0);
  assert.ok(dims.platformFit.score > 0);
  assert.ok(dims.feasibility.score > 0);
  assert.ok(dims.evidenceStrength.score > 0);

  // Verify non-empty human explanations exist
  assert.ok(dims.audienceDemand.explanation.length > 5);
  assert.ok(dims.differentiation.explanation.length > 5);
});

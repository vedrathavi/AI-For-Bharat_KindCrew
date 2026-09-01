import test from "node:test";
import assert from "node:assert/strict";
import { v4 as uuidv4 } from "uuid";
import { buildStage1To2Contract } from "../src/modules/ideation/contracts/stage1to2.contract.js";
import ContentIdea from "../models/ContentIdea.js";

test("Phase 3: buildStage1To2Contract creates valid Contract v2.0 payload", () => {
  const ideaId = uuidv4();
  const snapshotId = uuidv4();

  const opportunity = {
    title: "How Startups Repurpose Content",
    angle: "Step by step automation guide",
    hook: "Stop wasting 10 hours a week on social clips",
    platform: "linkedin",
    format: "carousel",
    contentType: "carousel",
    targetAudience: "Startup Founders",
    differentiation: "Uses real workflow heuristics",
    keyPoints: ["Audit existing content", "Set up automation tool", "Distribute cross-platform"],
  };

  const snapshot = {
    snapshotId,
    requestHash: "abcdef123456",
    researchConfidence: 0.9,
    verifiedSources: [
      { title: "Report 2026", url: "https://example.com", snippet: "Growth metrics..." },
    ],
    corpus: {
      audiencePainPoints: ["Editing takes too long"],
      contentGaps: ["Lack of templates"],
      keywords: [{ term: "automation", relevance: 0.9, importance: "high", definition: "Auto tasks", whyItMatters: "Saves time" }],
    },
  };

  const profile = {
    niche: { primary: "SaaS" },
    targetAudience: "Startup Founders",
    goals: { primaryGoal: "growth" },
    preferences: { tones: ["Professional"] },
  };

  const contract = buildStage1To2Contract({
    ideaId,
    snapshot,
    opportunity,
    creatorProfile: profile,
  });

  assert.equal(contract.contractVersion, "2.0");
  assert.equal(contract.topic, "How Startups Repurpose Content");
  assert.equal(contract.researchEvidence.verifiedSources.length, 1);
  assert.equal(contract.keywords[0].term, "automation");
  assert.equal(contract.creatorContextSnapshot.niche, "SaaS");
});

test("Phase 3: ContentIdea model converts v2 fields to DynamoDB item correctly", () => {
  const idea = new ContentIdea({
    ideaId: uuidv4(),
    userId: "user-456",
    topic: "AI Workflows",
    angle: "Automation angle",
    platform: "linkedin",
    contentType: "post",
    targetAudience: "Founders",
    schemaVersion: "1.0",
    researchSnapshotId: uuidv4(),
    requestHash: "hash-abc",
  });

  const item = idea.toDynamoItem();
  assert.equal(item.userId, "user-456");
  assert.equal(item.schemaVersion, "1.0");
  assert.equal(item.requestHash, "hash-abc");
});

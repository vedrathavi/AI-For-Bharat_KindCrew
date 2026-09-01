import test from "node:test";
import assert from "node:assert";
import { TavilyWebSearchProvider, CompositeWebResearchProvider } from "../src/modules/ideation/research/providers/webSearch.provider.js";
import { sourceIdsMatch, scoreOpportunity } from "../src/modules/ideation/scoring/ideaScorer.js";
import { ResearchOrchestrator } from "../src/modules/ideation/research/researchOrchestrator.js";

test("Quality Test 1: Deterministic source IDs (src_1, src_2, src_3)", async () => {
  const provider = new CompositeWebResearchProvider("fake_key");
  // Mock internal tavilyProvider search
  provider.tavilyProvider.search = async () => [
    { title: "Article 1", url: "https://example.com/1", content: "Snippet 1", score: 0.9, published_date: "2026-08-30" },
    { title: "Article 2", url: "https://example.com/2", content: "Snippet 2", score: 0.8, published_date: "2026-08-30" },
  ];

  const result = await provider.executeResearch(["query 1"], { enableLiveWebSearch: true });
  assert.strictEqual(result.sources.length, 2);
  assert.strictEqual(result.sources[0].sourceId, "src_1");
  assert.strictEqual(result.sources[1].sourceId, "src_2");
});

test("Quality Test 2 & 3 & 4: sourceIdsMatch rules (Exact, Legacy Suffix, Collision Prevention)", () => {
  // Rule 1 & 2: Exact Match
  assert.strictEqual(sourceIdsMatch("src_1", "src_1"), true, "src_1 <-> src_1 must match");

  // Rule 4: Collision Prevention (src_1 vs src_10)
  assert.strictEqual(sourceIdsMatch("src_1", "src_10"), false, "src_1 <-> src_10 must NOT match");
  assert.strictEqual(sourceIdsMatch("src_10", "src_1"), false, "src_10 <-> src_1 must NOT match");

  // Rule 3: Legacy suffixed source ID compatibility
  assert.strictEqual(sourceIdsMatch("src_1", "src_1_oldhash"), true, "src_1 <-> src_1_oldhash legacy match");
  assert.strictEqual(sourceIdsMatch("src_1_oldhash", "src_1"), true, "src_1_oldhash <-> src_1 legacy match");

  // Unrelated NO MATCH
  assert.strictEqual(sourceIdsMatch("src_1", "unrelated"), false, "src_1 <-> unrelated must NOT match");
});

test("Quality Test 5 & 6: Candidate evidence resolution & candidate-specific evidence strength", () => {
  const verifiedSources = [
    { sourceId: "src_1", domain: "thehindu.com", relevanceScore: 0.9 },
    { sourceId: "src_2", domain: "bbc.com", relevanceScore: 0.85 },
    { sourceId: "src_3", domain: "ndtv.com", relevanceScore: 0.8 },
  ];

  const snapshot = {
    verifiedSources,
    corpus: { keywords: [], contentGaps: [] },
    trendSignal: { status: "unavailable" },
    researchConfidence: 0.8,
  };

  const candidateWith3Sources = {
    title: "Strong Evidence Candidate",
    angle: "Explainer",
    platform: "twitter",
    format: "thread",
    evidencedBySourceIds: ["src_1", "src_2", "src_3"],
    targetPainPoint: "Audience pain point A",
    contentGap: "Content gap description A",
    differentiation: "Unique positioning A",
  };

  const candidateWith1Source = {
    title: "Weak Evidence Candidate",
    angle: "Opinion",
    platform: "twitter",
    format: "post",
    evidencedBySourceIds: ["src_1"],
    targetPainPoint: "Audience pain point B",
    contentGap: "Content gap description B",
    differentiation: "Unique positioning B",
  };

  const scoreStrong = scoreOpportunity(candidateWith3Sources, snapshot);
  const scoreWeak = scoreOpportunity(candidateWith1Source, snapshot);

  assert.strictEqual(scoreStrong.dimensions.evidenceStrength.score, 8.5);
  assert.strictEqual(scoreWeak.dimensions.evidenceStrength.score, 6.5);
  assert.notStrictEqual(scoreStrong.opportunityScore, scoreWeak.opportunityScore);
});

test("Quality Test 7 & 8: Event query news mode vs Evergreen query general mode", async () => {
  let capturedPayload = null;
  const provider = new TavilyWebSearchProvider("fake_key");
  provider.client = {
    search: async (query, payload) => {
      capturedPayload = payload;
      return { results: [] };
    },
  };

  // Event search
  await provider.search("CJP protest Jantar Mantar", { topic: "news", isBreakingEvent: true });
  assert.strictEqual(capturedPayload.topic, "news");

  // Evergreen search
  await provider.search("AI Governance framework", { topic: "general", isBreakingEvent: false });
  assert.strictEqual(capturedPayload.topic, undefined);
});

test("Quality Test 9: Current-event candidate relevance prompt instruction", () => {
  const orchestrator = new ResearchOrchestrator();
  const prompt = orchestrator._buildSynthesisPrompt({
    topic: "CJP protest at Jantar Mantar",
    audience: "General",
    platform: "twitter",
    creatorProfile: null,
    verifiedSources: [],
    trendSignal: null,
    previousItems: [],
    parentSnapshot: null,
    enableLiveWebSearch: true,
  });

  assert.ok(prompt.includes("CURRENT EVENT CANDIDATE GROUNDING RULE:"));
  assert.ok(prompt.includes("primarily address the actual event"));
});

test("Quality Test 10: Platform hard constraint preservation (Twitter vs YouTube)", async () => {
  const orchestrator = new ResearchOrchestrator();
  const promptTwitter = orchestrator._buildSynthesisPrompt({
    topic: "Test Topic",
    audience: "Audience",
    platform: "twitter",
    creatorProfile: null,
    verifiedSources: [],
    trendSignal: null,
    previousItems: [],
  });

  assert.ok(promptTwitter.includes('PLATFORM HARD CONSTRAINT: All generated opportunities MUST strictly target the requested platform: "twitter".'));
});

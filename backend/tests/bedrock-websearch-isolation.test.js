import test from "node:test";
import assert from "node:assert/strict";
import {
  BedrockMantleWebSearchProvider,
  BedrockWebSearchProvider,
  TavilyWebSearchProvider,
  CompositeWebResearchProvider,
} from "../src/modules/ideation/research/providers/webSearch.provider.js";
import { ResearchSnapshotSchema } from "../src/modules/ideation/schemas/ideation.schemas.js";

test("WebSearch 1: Provider Abstraction - BedrockMantleWebSearchProvider class exists with region us-east-1", () => {
  const globalRegion = process.env.AWS_REGION || "ap-south-1";
  assert.equal(globalRegion, "ap-south-1", "Global AWS_REGION must remain ap-south-1 (Mumbai)");

  const bedrockProvider = new BedrockMantleWebSearchProvider();
  assert.equal(bedrockProvider.region, "us-east-1", "BedrockMantleWebSearchProvider must target us-east-1");
  assert.equal(bedrockProvider.name, "aws_bedrock_web_search");
  assert.equal(BedrockWebSearchProvider, BedrockMantleWebSearchProvider, "Alias export must match BedrockMantleWebSearchProvider");
});

test("WebSearch 2: Live Web Research OFF - Tavily calls = 0", async () => {
  const composite = new CompositeWebResearchProvider("fake_key");
  let tavilyCalled = false;

  composite.primaryProvider.search = async () => {
    tavilyCalled = true;
    return [];
  };

  const result = await composite.executeResearch(["query 1", "query 2"], { enableLiveWebSearch: false });

  assert.equal(tavilyCalled, false, "Tavily must not be called when search is OFF");
  assert.equal(result.sources.length, 0);
  assert.equal(result.researchAvailability.webSearch, false);
  assert.equal(result.webResearch.enabled, false);
});

test("WebSearch 3: Tavily Direct Success - Tavily is primary active live web search provider", async () => {
  const composite = new CompositeWebResearchProvider("fake_key");
  let tavilyCalled = false;

  composite.primaryProvider.search = async (query) => {
    tavilyCalled = true;
    return [
      {
        sourceId: "src_tavily_1",
        title: "Tavily Grounded Source",
        url: "https://thehindu.com/article/1",
        domain: "thehindu.com",
        snippet: "Verified reporting",
        score: 0.95,
        publishedDate: "2026-08-30",
        sourceType: "news",
        query,
        provider: "tavily",
        relevanceScore: 0.95,
      },
    ];
  };

  const result = await composite.executeResearch(["CJP protest Jantar Mantar"], { enableLiveWebSearch: true });

  assert.equal(tavilyCalled, true, "Tavily must be called as primary active provider");
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].provider, "tavily");
  assert.equal(result.researchAvailability.provider, "tavily");
  assert.equal(result.webResearch.fallbackUsed, false);
  assert.equal(result.webResearch.primaryProvider, "tavily");
});

test("WebSearch 4: Tavily Failure - Graceful handling with zero fake sources", async () => {
  const composite = new CompositeWebResearchProvider("fake_key");
  composite.primaryProvider.search = async () => [];

  const result = await composite.executeResearch(["Obscure query"], { enableLiveWebSearch: true });

  assert.equal(result.sources.length, 0, "No sources should be fabricated");
  assert.equal(result.researchAvailability.webSearch, false);
  assert.equal(result.researchAvailability.provider, null);
  assert.equal(result.webResearch.sourceCount, 0);
});

import { v4 as uuidv4 } from "uuid";

test("WebSearch 5: ResearchSnapshotSchema validates webResearch provenance correctly", () => {
  const validSnapshot = {
    snapshotId: uuidv4(),
    userId: "user_test",
    requestHash: "hash_123",
    version: 1,
    parentSnapshotId: null,
    schemaVersion: "1.0",
    scoringVersion: "2.0",
    promptVersion: "1.0",
    status: "READY",
    topic: "CJP protest at Jantar Mantar",
    audience: "Indian Citizens",
    platform: "twitter",
    creatorContextHash: "ctx_123",
    researchGeneratedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    refreshedFrom: null,
    trendSignal: null,
    verifiedSources: [],
    corpus: {
      entities: [{ name: "CJP", type: "organization", description: "Protest party", sourceIds: [] }],
      events: [{ name: "Jantar Mantar Demonstration", location: "New Delhi", date: "2026", description: "Public protest", sourceIds: [] }],
      keywords: [{ term: "CJP", relevance: 0.9, importance: "high", definition: "Cockroach Janta Party", whyItMatters: "Primary political movement" }],
    },
    opportunities: [],
    researchConfidence: 0.45,
    confidenceSignals: {
      webSourceCount: 0,
      trendsAvailable: false,
      competitorContextAvailable: false,
      liveWebSearchEnabled: true,
      webSearchProvider: "tavily",
    },
    webResearch: {
      enabled: true,
      primaryProvider: "tavily",
      providersUsed: ["tavily"],
      queries: ["CJP protest Jantar Mantar"],
      sourceCount: 0,
      fallbackUsed: false,
      retrievedAt: new Date().toISOString(),
    },
  };

  const parsed = ResearchSnapshotSchema.parse(validSnapshot);
  assert.equal(parsed.webResearch.primaryProvider, "tavily");
  assert.equal(parsed.platform, "twitter");
});

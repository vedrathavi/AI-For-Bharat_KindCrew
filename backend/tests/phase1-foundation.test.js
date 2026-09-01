import test from "node:test";
import assert from "node:assert/strict";
import {
  generateRequestHash,
  generateCreatorContextHash,
  normalizeQuery,
} from "../src/modules/ideation/research/requestHasher.js";
import {
  NullWebSearchProvider,
  TavilyWebSearchProvider,
  createWebSearchProvider,
} from "../src/modules/ideation/research/providers/webSearch.provider.js";
import { TrendSignalProvider } from "../src/modules/ideation/research/providers/trendSignal.provider.js";
import { GenerateIdeasRequestSchema } from "../src/modules/ideation/schemas/ideation.schemas.js";

test("Phase 1: normalizeQuery strips punctuation and normalizes casing", () => {
  const input = "  AI Tools for Video Creators!!  ";
  const result = normalizeQuery(input);
  assert.equal(result, "ai tools for video creators");
});

test("Phase 1: generateRequestHash is deterministic for identical inputs", () => {
  const profile = {
    niche: { primary: "Tech", secondary: "AI" },
    strategy: { contentPillars: ["Automation", "Coding"] },
    goals: { primaryGoal: "growth" },
  };

  const hash1 = generateRequestHash({
    topic: "AI Productivity",
    audience: "Developers",
    platform: "LinkedIn",
    creatorProfile: profile,
  });

  const hash2 = generateRequestHash({
    topic: "ai productivity",
    audience: "developers",
    platform: "linkedin",
    creatorProfile: profile,
  });

  assert.equal(hash1, hash2);
});

test("Phase 1: generateCreatorContextHash changes when material profile fields change", () => {
  const profile1 = {
    niche: { primary: "Tech" },
    strategy: { contentPillars: ["Automation"] },
  };

  const profile2 = {
    niche: { primary: "Finance" },
    strategy: { contentPillars: ["Investing"] },
  };

  const hash1 = generateCreatorContextHash(profile1);
  const hash2 = generateCreatorContextHash(profile2);

  assert.notEqual(hash1, hash2);
});

test("Phase 1: WebSearchProvider graceful fallback with NullWebSearchProvider", async () => {
  const provider = new NullWebSearchProvider();
  const results = await provider.search("test query");
  assert.deepEqual(results, []);
});

test("Phase 1: TrendSignalProvider graceful fallback when keyword is empty", async () => {
  const provider = new TrendSignalProvider();
  const signal = await provider.getTrendSignal("");
  assert.equal(signal, null);
});

test("Phase 1: GenerateIdeasRequestSchema validates request bodies correctly", () => {
  const validPayload = {
    niche: "AI",
    audience: "Founders",
    platforms: ["linkedin"],
  };

  const parsed = GenerateIdeasRequestSchema.safeParse(validPayload);
  assert.equal(parsed.success, true);
});

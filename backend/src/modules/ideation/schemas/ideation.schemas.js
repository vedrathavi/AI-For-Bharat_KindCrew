import { z } from "zod";

/**
 * Zod Schemas for Stage I — Research & Ideation
 * Defines strict boundary validation across API inputs, external providers,
 * Bedrock outputs, ResearchSnapshots, scoring, and Stage I -> II contracts.
 */

// --- API Request Schemas ---

export const GenerateIdeasRequestSchema = z.object({
  niche: z.string().min(1, "Niche is required").max(200),
  audience: z.string().min(1, "Audience is required").max(300),
  platforms: z
    .array(z.string())
    .min(1, "At least one platform is required"),
  goal: z.string().optional().default("growth"),
  enableLiveWebSearch: z.boolean().optional().default(false),
  forceRefresh: z.boolean().optional().default(false),
});

export const RefineIdeaRequestSchema = z.object({
  roughIdea: z.string().min(1, "Rough idea is required").max(500),
  audience: z.string().min(1, "Audience is required").max(300),
  platform: z.string().min(1, "Platform is required"),
  enableLiveWebSearch: z.boolean().optional().default(false),
  forceRefresh: z.boolean().optional().default(false),
});

export const EvaluateIdeaRequestSchema = z.object({
  idea: z.string().min(1, "Idea is required").max(500),
  audience: z.string().min(1, "Audience is required").max(300),
  platform: z.string().min(1, "Platform is required"),
  enableLiveWebSearch: z.boolean().optional().default(false),
  forceRefresh: z.boolean().optional().default(false),
});

export const ResearchIdeaRequestSchema = z.object({
  idea: z.string().min(1, "Idea is required").max(500),
  audience: z.string().min(1, "Audience is required").max(300),
  platform: z.string().optional().default("general"),
  enableLiveWebSearch: z.boolean().optional().default(false),
  forceRefresh: z.boolean().optional().default(false),
});

export const SelectIdeaRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  angle: z.string().min(1, "Angle is required"),
  platform: z.string().min(1, "Platform is required"),
  contentType: z.string().optional().default("post"),
  targetAudience: z.string().optional().default("General Audience"),
  hookIdea: z.string().optional().default(""),
  keyPoints: z.array(z.string()).optional().default([]),
  scores: z.record(z.unknown()).optional().default({}),
  research: z.record(z.unknown()).optional().default({}),
  researchSnapshotId: z.string().nullable().optional().default(null),
  requestHash: z.string().nullable().optional().default(null),
  contractVersion: z.string().optional().default("2.0"),
});

export const RefreshResearchRequestSchema = z.object({
  snapshotId: z.string().min(1, "snapshotId is required"),
  enableLiveWebSearch: z.boolean().optional().default(false),
});

// --- External Research Provider Schemas ---

export const TavilyResultSchema = z.object({
  title: z.string().default("Untitled Source"),
  url: z.string().default("#"),
  content: z.string().default(""),
  score: z.number().default(0.5),
  published_date: z.string().nullable().optional().default(null),
});

export const TrendSignalSchema = z.object({
  keyword: z.string(),
  status: z.enum(["available", "unavailable", "insufficient"]).default("available"),
  avgInterest: z.number().nullable().optional().default(null),
  peakInterest: z.number().nullable().optional().default(null),
  recentTrend: z.enum(["rising", "stable", "falling"]).nullable().optional().default(null),
  competitionScore: z.number().min(1).max(10).nullable().optional().default(null),
  reason: z.string().nullable().optional().default(null),
  source: z.string().default("google-trends"),
  retrievedAt: z.string(),
  cached: z.boolean().default(false),
});

// --- Bedrock Output Schemas ---

export const EntitySchema = z.object({
  name: z.string(),
  type: z.string().default("organization"),
  description: z.string().default(""),
  sourceIds: z.array(z.string()).optional().default([]),
});

export const EventSchema = z.object({
  name: z.string(),
  location: z.string().optional().default(""),
  date: z.string().optional().default(""),
  description: z.string().default(""),
  sourceIds: z.array(z.string()).optional().default([]),
});

export const AudiencePainPointSchema = z.object({
  claimId: z.string().default(() => `clm_${Math.random().toString(36).slice(2, 9)}`),
  point: z.string(),
  evidencedBySourceIds: z.array(z.string()).optional().default([]),
});

export const ContentGapSchema = z.object({
  gapId: z.string().default(() => `gap_${Math.random().toString(36).slice(2, 9)}`),
  description: z.string(),
  evidencedBySourceIds: z.array(z.string()).optional().default([]),
});

export const KeywordSchema = z.object({
  term: z.string(),
  relevance: z.number().min(0).max(1).default(0.8),
  importance: z.enum(["high", "medium", "low"]).default("medium"),
  definition: z.string().default("Key topic term"),
  whyItMatters: z.string().default("Relevant to audience interest"),
  relatedTerms: z.array(z.string()).optional().default([]),
});

export const ResearchCorpusSchema = z.object({
  entities: z.array(EntitySchema).default([]),
  events: z.array(EventSchema).default([]),
  entityConfidence: z.enum(["high", "medium", "low"]).optional().default("high"),
  ambiguityNotes: z.string().optional().default(""),
  audiencePainPoints: z.array(AudiencePainPointSchema).default([]),
  competitorPatterns: z.array(z.object({
    pattern: z.string(),
    evidencedBySourceIds: z.array(z.string()).optional().default([]),
  })).default([]),
  contentGaps: z.array(ContentGapSchema).default([]),
  keywords: z.array(KeywordSchema).default([]),
  recommendedStructure: z.string().default("Hook -> Core Value -> Practical Examples -> Call to Action"),
});

export const CandidateOpportunitySchema = z.object({
  title: z.string(),
  angle: z.string(),
  platform: z.string(),
  format: z.string().default("post"),
  hook: z.string(),
  contentHooks: z.array(z.string()).default([]),
  description: z.string(),
  targetPainPoint: z.string().optional().default(""),
  contentGap: z.string().optional().default(""),
  whyThisAngleMatters: z.string().optional().default(""),
  targetedKeywords: z.array(z.string()).default([]),
  differentiation: z.string(),
  keyPoints: z.array(z.string()).default([]),
  evidencedBySourceIds: z.array(z.string()).default([]),
});

// --- Scoring & Confidence Schemas ---

export const DimensionScoreSchema = z.object({
  score: z.number().min(0).max(10),
  explanation: z.string(),
  sourceSignals: z.array(z.string()).default([]),
});

export const IdeaScoreSchema = z.object({
  overall: z.number().min(0).max(10),
  opportunityScore: z.number().min(0).max(10),
  researchConfidence: z.number().min(0).max(1),
  trendConfidence: z.number().min(0).max(1).default(0),
  scoringVersion: z.literal("2.0"),
  dimensions: z.object({
    audienceDemand: DimensionScoreSchema,
    trendMomentum: DimensionScoreSchema,
    creatorFit: DimensionScoreSchema,
    contentGap: DimensionScoreSchema,
    differentiation: DimensionScoreSchema,
    novelty: DimensionScoreSchema,
    competition: DimensionScoreSchema,
    platformFit: DimensionScoreSchema,
    feasibility: DimensionScoreSchema,
    evidenceStrength: DimensionScoreSchema,
  }),
});

// --- ResearchSnapshot Schema ---

export const VerifiedSourceSchema = z.object({
  sourceId: z.string(),
  title: z.string(),
  url: z.string(),
  domain: z.string(),
  snippet: z.string(),
  score: z.number().default(0.5),
  publishedDate: z.string().nullable().optional().default(null),
  retrievedAt: z.string(),
  sourceType: z.enum(["industry_report", "news", "analysis", "reference", "blog", "forum", "official", "web"]).default("web"),
  relevanceScore: z.number().default(0.8),
});

export const ResearchSnapshotSchema = z.object({
  snapshotId: z.string().uuid(),
  userId: z.string(),
  requestHash: z.string(),
  version: z.number().int().positive().default(1),
  parentSnapshotId: z.string().nullable().optional().default(null),
  schemaVersion: z.string().default("1.0"),
  scoringVersion: z.string().default("2.0"),
  promptVersion: z.string().default("1.0"),
  status: z.enum(["READY", "INITIALIZING", "ERROR"]).default("READY"),
  
  topic: z.string(),
  audience: z.string(),
  platform: z.string(),
  creatorContextHash: z.string(),
  
  researchGeneratedAt: z.string(),
  expiresAt: z.string(),
  refreshedFrom: z.string().nullable().optional().default(null),
  
  trendSignal: TrendSignalSchema.nullable().optional().default(null),
  verifiedSources: z.array(VerifiedSourceSchema).default([]),
  corpus: ResearchCorpusSchema,
  opportunities: z.array(CandidateOpportunitySchema).default([]),
  
  researchConfidence: z.number().min(0).max(1).default(0.5),
  confidenceSignals: z.object({
    webSourceCount: z.number().default(0),
    trendsAvailable: z.boolean().default(false),
    competitorContextAvailable: z.boolean().default(false),
    liveWebSearchEnabled: z.boolean().optional().default(false),
    webSearchProvider: z.string().nullable().optional().default(null),
  }),
  webResearch: z.object({
    enabled: z.boolean().default(false),
    primaryProvider: z.string().nullable().optional().default(null),
    providersUsed: z.array(z.string()).default([]),
    region: z.string().optional().default("us-east-1"),
    queries: z.array(z.string()).default([]),
    sourceCount: z.number().default(0),
    fallbackUsed: z.boolean().default(false),
    retrievedAt: z.string().optional(),
    awsDiagnostics: z.any().optional().nullable(),
  }).optional(),
});

// --- Stage I -> Stage II Contract Schema ---

export const Stage1To2ContractSchema = z.object({
  contractVersion: z.literal("2.0"),
  ideaId: z.string().uuid(),
  researchSnapshotId: z.string().nullable(),
  requestHash: z.string().nullable(),
  topic: z.string(),
  angle: z.string(),
  hook: z.string(),
  platform: z.string(),
  format: z.string(),
  contentType: z.string(),
  targetAudience: z.string(),
  differentiation: z.string(),
  keyPoints: z.array(z.string()),
  keywords: z.array(KeywordSchema),
  researchEvidence: z.object({
    audiencePainPoints: z.array(z.string()).default([]),
    contentGaps: z.array(z.string()).default([]),
    candidatePainPoint: z.string().optional().default(""),
    candidateContentGap: z.string().optional().default(""),
    entities: z.array(EntitySchema).optional().default([]),
    events: z.array(EventSchema).optional().default([]),
    verifiedSources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })).default([]),
    researchConfidence: z.number().default(0.5),
    webResearch: z.any().optional(),
  }),
  scores: IdeaScoreSchema,
  creatorContextSnapshot: z.object({
    niche: z.string(),
    audience: z.string(),
    goal: z.string(),
    tone: z.string(),
    style: z.string(),
  }),
});

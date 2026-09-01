/**
 * TypeScript Interfaces for Stage I — Research & Ideation
 */

export interface Keyword {
  term: string;
  relevance: number;
  importance: "high" | "medium" | "low";
  definition: string;
  whyItMatters: string;
  relatedTerms?: string[];
}

export interface VerifiedSource {
  sourceId: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  score: number;
  publishedDate?: string | null;
  retrievedAt: string;
  sourceType: "industry_report" | "news" | "analysis" | "reference" | "blog" | "forum" | "official" | "web";
  relevanceScore: number;
}

export interface AudiencePainPoint {
  claimId: string;
  point: string;
  evidencedBySourceIds?: string[];
}

export interface ContentGap {
  gapId: string;
  description: string;
  evidencedBySourceIds?: string[];
}

export interface DimensionScore {
  score: number;
  explanation: string;
  sourceSignals: string[];
}

export interface IdeaScore {
  overall: number;
  opportunityScore: number;
  researchConfidence: number;
  scoringVersion: "2.0";
  dimensions: {
    audienceDemand: DimensionScore;
    trendMomentum: DimensionScore;
    creatorFit: DimensionScore;
    contentGap: DimensionScore;
    differentiation: DimensionScore;
    novelty: DimensionScore;
    competition: DimensionScore;
    platformFit: DimensionScore;
    feasibility: DimensionScore;
    evidenceStrength: DimensionScore;
  };
}

export interface Entity {
  name: string;
  type: string;
  description: string;
  sourceIds?: string[];
}

export interface EventEntity {
  name: string;
  location?: string;
  date?: string;
  description: string;
  sourceIds?: string[];
}

export interface CandidateOpportunity {
  title: string;
  angle: string;
  platform: string;
  format: string;
  hook: string;
  contentHooks: string[];
  description: string;
  targetPainPoint?: string;
  contentGap?: string;
  whyThisAngleMatters?: string;
  targetedKeywords: string[];
  differentiation: string;
  keyPoints: string[];
  evidencedBySourceIds?: string[];
  scores?: IdeaScore;
}

export interface ResearchCorpus {
  entities?: Entity[];
  events?: EventEntity[];
  audiencePainPoints: AudiencePainPoint[];
  competitorPatterns: Array<{ pattern: string; evidencedBySourceIds?: string[] }>;
  contentGaps: ContentGap[];
  keywords: Keyword[];
  recommendedStructure: string;
}

export interface TrendSignal {
  keyword: string;
  avgInterest: number | null;
  peakInterest: number | null;
  recentTrend: "rising" | "stable" | "falling" | null;
  competitionScore: number;
  source: string;
  retrievedAt: string;
  cached: boolean;
}

export interface ResearchSnapshot {
  snapshotId: string;
  userId: string;
  requestHash: string;
  version: number;
  parentSnapshotId?: string | null;
  schemaVersion: "1.0";
  scoringVersion: "2.0";
  promptVersion: "1.0";
  status: "READY" | "INITIALIZING" | "ERROR";
  
  topic: string;
  audience: string;
  platform: string;
  creatorContextHash: string;
  
  researchGeneratedAt: string;
  expiresAt: string;
  refreshedFrom?: string | null;
  
  trendSignal?: TrendSignal | null;
  verifiedSources: VerifiedSource[];
  corpus: ResearchCorpus;
  opportunities: CandidateOpportunity[];
  
  researchConfidence: number;
  confidenceSignals: {
    webSourceCount: number;
    trendsAvailable: boolean;
    competitorContextAvailable: boolean;
  };
}

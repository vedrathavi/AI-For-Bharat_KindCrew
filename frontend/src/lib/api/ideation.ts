// Phase 1: Ideation & Research API Client

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ContentIdea {
  title: string;
  description?: string;
  angle: string;
  platform: string;
  format: string;
  contentType?: string;
  hook?: string;
  hookIdea?: string;
  scores: {
    virality: number;
    clarity: number;
    competition: number;
    overall: number;
  };
}

export interface IdeaBrief {
  ideaId: string;
  userId: string;
  topic: string;
  angle: string;
  platform: string;
  contentType: string;
  targetAudience: string;
  hookIdea: string;
  keyPoints: string[];
  scores: {
    virality: number;
    clarity: number;
    competition: number;
    overall: number;
  };
  research?: {
    audiencePainPoints?: string[];
    competitorPatterns?: string[];
    recommendedStructure?: string;
    keyPoints?: string[];
    yourAngleStrength?: string;
  };
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResearchData {
  audiencePainPoints: string[];
  competitorPatterns: string[];
  recommendedStructure?: string;
  keyPoints: string[];
  yourAngleStrength?: string;
}

export interface IdeaEvaluation {
  improvedTitle?: string;
  suggestedHook?: string;
  format?: string;
  scores: {
    virality: number;
    clarity: number;
    competition: number;
    overall: number;
  };
}

/**
 * Generate ideas (Zero Idea flow)
 */
export async function generateIdeas(userId: string, profile: {
  niche: string;
  audience: string;
  platforms: string[];
  goal: string;
}): Promise<{ success: boolean; ideas: ContentIdea[]; count?: number; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...profile }),
  });
  
  return response.json();
}

/**
 * Refine idea (Some Idea flow)
 */
export async function refineIdea(userId: string, data: {
  roughIdea: string;
  audience: string;
  platform: string;
}): Promise<{ success: boolean; ideas: ContentIdea[]; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });
  
  return response.json();
}

/**
 * Evaluate idea (Full Idea flow)
 */
export async function evaluateIdea(userId: string, data: {
  idea: string;
  audience: string;
  platform: string;
}): Promise<{ success: boolean; evaluation: IdeaEvaluation; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });
  
  return response.json();
}

/**
 * Research an idea
 */
export async function researchIdea(userId: string, data: {
  idea: string;
  audience: string;
}): Promise<{ success: boolean; research: ResearchData; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });
  
  return response.json();
}

/**
 * Select and save idea
 */
export async function selectIdea(userId: string, contentBrief: Partial<IdeaBrief>): Promise<{
  success: boolean;
  ideaId?: string;
  contentBrief?: IdeaBrief;
  message?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...contentBrief }),
  });
  
  return response.json();
}

/**
 * Get user's ideas
 */
export async function getUserIdeas(userId: string): Promise<{
  success: boolean;
  ideas: IdeaBrief[];
  count?: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/my-ideas?userId=${userId}`);
  return response.json();
}

/**
 * Generate and persist research for an already saved idea
 */
export async function enrichIdeaResearch(userId: string, ideaId: string): Promise<{
  success: boolean;
  research?: ResearchData;
  message?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/enrich-research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ideaId }),
  });

  return response.json();
}

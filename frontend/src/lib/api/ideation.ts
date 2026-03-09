// Phase 1: Ideation & Research API Client
import { API_URL } from "@/lib/constants";

const API_BASE_URL = API_URL || "";

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data = await response.json();
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  } catch {
    // Ignore JSON parse errors and use fallback below.
  }

  return `${fallbackMessage} (${response.status} ${response.statusText})`;
}

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
  hasContent?: boolean;
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
export async function generateIdeas(
  token: string,
  profile: {
    niche: string;
    audience: string;
    platforms: string[];
    goal: string;
  },
): Promise<{
  success: boolean;
  ideas: ContentIdea[];
  count?: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ ...profile }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to generate ideas"));
  }

  return response.json();
}

/**
 * Refine idea (Some Idea flow)
 */
export async function refineIdea(
  token: string,
  data: {
    roughIdea: string;
    audience: string;
    platform: string;
  },
): Promise<{ success: boolean; ideas: ContentIdea[]; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/refine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ ...data }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to refine idea"));
  }

  return response.json();
}

/**
 * Evaluate idea (Full Idea flow)
 */
export async function evaluateIdea(
  token: string,
  data: {
    idea: string;
    audience: string;
    platform: string;
  },
): Promise<{ success: boolean; evaluation: IdeaEvaluation; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ ...data }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to evaluate idea"));
  }

  return response.json();
}

/**
 * Research an idea
 */
export async function researchIdea(
  token: string,
  data: {
    idea: string;
    audience: string;
  },
): Promise<{ success: boolean; research: ResearchData; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ ...data }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to research idea"));
  }

  return response.json();
}

/**
 * Select and save idea
 */
export async function selectIdea(
  token: string,
  contentBrief: Partial<IdeaBrief>,
): Promise<{
  success: boolean;
  ideaId?: string;
  contentBrief?: IdeaBrief;
  message?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/select`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ ...contentBrief }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to save selected idea"));
  }

  return response.json();
}

/**
 * Get user's ideas
 */
export async function getUserIdeas(token: string): Promise<{
  success: boolean;
  ideas: IdeaBrief[];
  count?: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/my-ideas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to fetch user ideas"));
  }

  return response.json();
}

/**
 * Generate and persist research for an already saved idea
 */
export async function enrichIdeaResearch(
  token: string,
  ideaId: string,
): Promise<{
  success: boolean;
  research?: ResearchData;
  message?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/enrich-research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ ideaId }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to enrich idea research"));
  }

  return response.json();
}

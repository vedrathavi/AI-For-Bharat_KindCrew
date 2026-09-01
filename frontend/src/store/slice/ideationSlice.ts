import { StateCreator } from "zustand";
import {
  generateIdeas,
  getUserIdeas,
  refineIdea as refineIdeaApi,
  researchIdea as researchIdeaApi,
  ContentIdea,
  IdeaBrief,
} from "@/lib/api/ideation";
import { refreshResearch as refreshResearchApi } from "@/lib/api/research";
import { ResearchSnapshot } from "@/types/research";

export interface Idea extends ContentIdea {
  ideaId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  researchSnapshotId?: string;
}

export interface IdeationProfile {
  niche: string;
  audience: string;
  platforms: string[];
  goal: string;
}

interface IdeationRefineInput {
  roughIdea: string;
  audience: string;
  platform: string;
}

interface AuthState {
  token: string | null;
}

function normalizeSavedIdea(idea: IdeaBrief): Idea {
  return {
    ideaId: idea.ideaId,
    userId: idea.userId,
    createdAt: idea.createdAt || new Date().toISOString(),
    updatedAt: idea.updatedAt,
    title: idea.topic || "Untitled Idea",
    description: idea.angle || "",
    angle: idea.angle || "",
    platform: idea.platform || "linkedin",
    format: idea.contentType || "post",
    contentType: idea.contentType,
    hookIdea: idea.hookIdea,
    researchSnapshotId: idea.researchSnapshotId,
    scores: idea.scores || {
      overall: 0,
      opportunityScore: 0,
      researchConfidence: 0,
      scoringVersion: "2.0",
      dimensions: {},
    },
  };
}

export type IdeationSlice = {
  // State
  ideas: Idea[];
  selectedIdea: Idea | null;
  loading: boolean;
  error: string | null;
  profile: IdeationProfile;
  researchSnapshot: ResearchSnapshot | null;
  researchSnapshotId: string | null;
  researchLoading: boolean;

  // Actions
  setProfile: (profile: IdeationProfile) => void;
  generateIdeas: (
    userId: string,
    profile: IdeationProfile & { enableLiveWebSearch?: boolean },
  ) => Promise<Idea[] | null>;
  refineIdea: (
    userId: string,
    _legacy?: string,
    data?: IdeationRefineInput & { enableLiveWebSearch?: boolean },
  ) => Promise<Idea[] | null>;
  runResearch: (
    idea: string,
    audience: string,
    forceRefresh?: boolean,
    enableLiveWebSearch?: boolean,
    platform?: string,
  ) => Promise<ResearchSnapshot | null>;
  refreshResearch: (snapshotId: string, enableLiveWebSearch?: boolean) => Promise<ResearchSnapshot | null>;
  fetchUserIdeas: (userId: string) => Promise<Idea[]>;
  removeIdeaFromState: (ideaId: string) => void;
  selectIdea: (idea: Idea) => void;
  clearIdeas: () => void;
  clearError: () => void;
  setError: (error: string) => void;
};

function sanitizeIdea(idea: any): any {
  if (!idea || typeof idea !== "object") return idea;
  const clean: any = { ...idea };
  ["title", "description", "angle", "platform", "format"].forEach((key) => {
    if (clean[key] && typeof clean[key] === "object") {
      try {
        clean[key] = JSON.stringify(clean[key]);
      } catch {
        clean[key] = String(clean[key]);
      }
    }
  });
  return clean;
}

export const createIdeationSlice: StateCreator<
  IdeationSlice,
  [],
  [],
  IdeationSlice
> = (set, get) => ({
  ideas: [],
  selectedIdea: null,
  loading: false,
  error: null,
  profile: {
    niche: "",
    audience: "",
    platforms: [],
    goal: "",
  },
  researchSnapshot: null,
  researchSnapshotId: null,
  researchLoading: false,

  setProfile: (profile) =>
    set({
      profile,
      error: null,
    }),

  generateIdeas: async (_userId, profile) => {
    set({ loading: true, error: null });
    try {
      const token = (get() as unknown as AuthState).token;
      if (!token) {
        set({ loading: false, error: "No authentication token available" });
        return null;
      }

      const result = await generateIdeas(token, profile);
      if (result.success && result.ideas) {
        const cleaned = (result.ideas as any[]).map(sanitizeIdea) as Idea[];
        set({
          ideas: cleaned,
          profile,
          researchSnapshotId: result.researchSnapshotId || null,
          loading: false,
          error: null,
        });
        return cleaned;
      } else {
        const errorMsg = result.error || "Failed to generate ideas";
        set({ loading: false, error: errorMsg });
        return null;
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to generate ideas";
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  refineIdea: async (_userId, _legacy, data) => {
    set({ loading: true, error: null });
    try {
      const token = (get() as unknown as AuthState).token;

      if (!token) {
        set({ loading: false, error: "No authentication token available" });
        return null;
      }

      if (!data?.roughIdea?.trim() || !data.audience?.trim() || !data.platform?.trim()) {
        set({ loading: false, error: "Missing required fields for refining idea" });
        return null;
      }

      const result = await refineIdeaApi(token, {
        roughIdea: data.roughIdea,
        audience: data.audience,
        platform: data.platform,
      });

      if (result.success && result.ideas) {
        const cleaned = (result.ideas as any[]).map(sanitizeIdea) as Idea[];
        set({
          ideas: cleaned,
          researchSnapshotId: result.researchSnapshotId || null,
          loading: false,
          error: null,
        });
        return cleaned;
      }

      const errorMsg = result.error || "Failed to refine idea";
      set({ loading: false, error: errorMsg });
      return null;
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to refine idea";
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  runResearch: async (idea, audience, forceRefresh = false, enableLiveWebSearch = false, platform = "") => {
    set({ researchLoading: true, error: null });
    try {
      const token = (get() as unknown as AuthState).token;
      if (!token) {
        set({ researchLoading: false, error: "No authentication token available" });
        return null;
      }

      const result = await researchIdeaApi(token, {
        idea,
        audience,
        platform,
        enableLiveWebSearch,
        forceRefresh,
      });
      if (result.success && result.research) {
        set({
          researchSnapshot: result.research,
          researchSnapshotId: result.snapshotId || result.research.snapshotId,
          researchLoading: false,
          error: null,
        });
        return result.research;
      }

      set({ researchLoading: false, error: result.error || "Failed to conduct research" });
      return null;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to conduct research";
      set({ researchLoading: false, error: errorMsg });
      return null;
    }
  },

  refreshResearch: async (snapshotId) => {
    set({ researchLoading: true, error: null });
    try {
      const token = (get() as unknown as AuthState).token;
      if (!token) {
        set({ researchLoading: false, error: "No authentication token available" });
        return null;
      }

      const result = await refreshResearchApi(token, snapshotId);
      if (result.success && result.research) {
        set({
          researchSnapshot: result.research,
          researchSnapshotId: result.newSnapshotId || result.research.snapshotId,
          researchLoading: false,
          error: null,
        });
        return result.research;
      }

      set({ researchLoading: false, error: result.error || "Failed to refresh research" });
      return null;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to refresh research";
      set({ researchLoading: false, error: errorMsg });
      return null;
    }
  },

  fetchUserIdeas: async (token) => {
    set({ loading: true, error: null });
    try {
      const result = await getUserIdeas(token);
      if (result.success && result.ideas) {
        const normalizedIdeas = result.ideas.map(normalizeSavedIdea);
        set({
          ideas: normalizedIdeas,
          loading: false,
          error: null,
        });
        return normalizedIdeas;
      } else {
        const errorMsg = result.error || "Failed to fetch ideas";
        set({ loading: false, error: errorMsg });
        return [];
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch ideas";
      set({ loading: false, error: errorMsg });
      return [];
    }
  },

  removeIdeaFromState: (ideaId: string) =>
    set((state) => ({
      ideas: state.ideas.filter((i) => i.ideaId !== ideaId),
      selectedIdea: state.selectedIdea?.ideaId === ideaId ? null : state.selectedIdea,
    })),

  selectIdea: (idea) =>
    set({
      selectedIdea: idea,
      error: null,
    }),

  clearIdeas: () =>
    set({
      ideas: [],
      selectedIdea: null,
      researchSnapshot: null,
      researchSnapshotId: null,
      profile: {
        niche: "",
        audience: "",
        platforms: [],
        goal: "",
      },
    }),

  clearError: () => set({ error: null }),

  setError: (error) => set({ error }),
});

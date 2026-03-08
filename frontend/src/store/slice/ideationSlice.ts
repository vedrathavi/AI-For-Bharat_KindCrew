import { StateCreator } from "zustand";
import {
  generateIdeas,
  getUserIdeas,
  refineIdea as refineIdeaApi,
  ContentIdea,
  IdeaBrief,
} from "@/lib/api/ideation";

export interface Idea extends ContentIdea {
  ideaId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
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
    scores: {
      virality: Number(idea.scores?.virality ?? 0),
      clarity: Number(idea.scores?.clarity ?? 0),
      competition: Number(idea.scores?.competition ?? 0),
      overall: Number(idea.scores?.overall ?? 0),
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

  // Actions
  setProfile: (profile: IdeationProfile) => void;
  generateIdeas: (
    userId: string,
    profile: IdeationProfile,
  ) => Promise<Idea[] | null>;
  refineIdea: (
    userId: string,
    _legacy?: string,
    data?: IdeationRefineInput,
  ) => Promise<Idea[] | null>;
  fetchUserIdeas: (userId: string) => Promise<Idea[]>;
  selectIdea: (idea: Idea) => void;
  clearIdeas: () => void;
  clearError: () => void;
  setError: (error: string) => void;
};


function sanitizeIdea(idea: any): any {
  // convert any object-valued fields to JSON strings to avoid React render errors
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

  setProfile: (profile) =>
    set({
      profile,
      error: null,
    }),

  generateIdeas: async (userId, profile) => {
    set({ loading: true, error: null });
    try {
      const result = await generateIdeas(userId, profile);
      if (result.success && result.ideas) {
        const cleaned = (result.ideas as any[]).map(sanitizeIdea) as Idea[];
        set({
          ideas: cleaned,
          profile,
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
        const errorMsg = "No authentication token available";
        set({ loading: false, error: errorMsg });
        return null;
      }

      if (!data?.roughIdea?.trim() || !data.audience?.trim() || !data.platform?.trim()) {
        const errorMsg = "Missing required fields for refining idea";
        set({ loading: false, error: errorMsg });
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

  selectIdea: (idea) =>
    set({
      selectedIdea: idea,
      error: null,
    }),

  clearIdeas: () =>
    set({
      ideas: [],
      selectedIdea: null,
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

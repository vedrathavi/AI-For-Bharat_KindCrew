import { StateCreator } from "zustand";
import {
  createContentFromIdea,
  createContentFromManual,
  getContentById,
  getUserContent,
} from "@/lib/api/content";

// Type for accessing auth state from combined store
interface AuthState {
  token: string | null;
}

export interface ContentItem {
  contentId: string;
  userId: string;
  ideaId?: string;
  topic: string;
  contentType: string;
  createdAt: string;
  updatedAt?: string;
  platformVariants?: Record<string, unknown>;
  outline?: Record<string, unknown>;
  draft?: { text?: string } | string;
  scripts?: Record<string, unknown>;
  status?: string;
  source?: "server" | "local";
}

export interface ContentCustomization {
  tone: string;
  length: string;
  hookStyle: string;
  ctaStrength: string;
  selectedPlatforms: string[];
}

export type ContentSlice = {
  // State
  contentList: ContentItem[];
  selectedContent: ContentItem | null;
  generatedContent: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  customization: ContentCustomization;

  // Actions
  setCustomization: (customization: Partial<ContentCustomization>) => void;
  createFromIdea: (
    userId: string,
    ideaId: string,
    options?: Record<string, unknown>,
  ) => Promise<ContentItem | null>;
  createFromManual: (
    userId: string,
    contentData: Record<string, unknown>,
  ) => Promise<ContentItem | null>;
  fetchUserContent: (userId: string) => Promise<ContentItem[]>;
  fetchContentById: (
    userId: string,
    contentId: string,
  ) => Promise<ContentItem | null>;
  selectContent: (content: ContentItem) => void;
  setGeneratedContent: (content: Record<string, unknown> | null) => void;
  clearContent: () => void;
  clearError: () => void;
  setError: (error: string) => void;
};

export const createContentSlice: StateCreator<
  ContentSlice,
  [],
  [],
  ContentSlice
> = (set, get) => ({
  contentList: [],
  selectedContent: null,
  generatedContent: null,
  loading: false,
  error: null,
  customization: {
    tone: "professional",
    length: "medium",
    hookStyle: "question",
    ctaStrength: "moderate",
    selectedPlatforms: [],
  },

  setCustomization: (customization) =>
    set((state) => ({
      customization: {
        ...state.customization,
        ...customization,
      },
      error: null,
    })),

  createFromIdea: async (userId, ideaId, options) => {
    set({ loading: true, error: null });
    try {
      // Get token from auth state
      const state = get() as unknown as AuthState;
      const token = state.token;
      if (!token) {
        const errorMsg = "No authentication token available";
        set({ loading: false, error: errorMsg });
        return null;
      }

      const result = await createContentFromIdea(token, ideaId, options);
      if (result.success && result.content) {
        const newContent = result.content as ContentItem;
        set((state) => ({
          contentList: [...state.contentList, newContent],
          generatedContent: newContent as unknown as Record<string, unknown>,
          loading: false,
          error: null,
        }));
        return newContent;
      } else {
        const errorMsg = result.error || "Failed to create content from idea";
        set({ loading: false, error: errorMsg });
        return null;
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to create content from idea";
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  createFromManual: async (userId, contentData) => {
    set({ loading: true, error: null });
    try {
      // Get token from auth state
      const state = get() as unknown as AuthState;
      const token = state.token;
      if (!token) {
        const errorMsg = "No authentication token available";
        set({ loading: false, error: errorMsg });
        return null;
      }

      const result = await createContentFromManual(token, contentData);
      if (result.success && result.content) {
        const newContent = result.content as ContentItem;
        set((state) => ({
          contentList: [...state.contentList, newContent],
          generatedContent: newContent as unknown as Record<string, unknown>,
          loading: false,
          error: null,
        }));
        return newContent;
      } else {
        const errorMsg = result.error || "Failed to create content manually";
        set({ loading: false, error: errorMsg });
        return null;
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to create content manually";
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  fetchUserContent: async (_userId) => {
    set({ loading: true, error: null });
    try {
      // Get token from auth state
      const state = get() as unknown as AuthState;
      const token = state.token;
      if (!token) {
        const errorMsg = "No authentication token available";
        set({ loading: false, error: errorMsg });
        return [];
      }

      const result = await getUserContent(token);
      if (result.success && result.content) {
        const content = result.content as ContentItem[];
        set({
          contentList: content,
          loading: false,
          error: null,
        });
        return content;
      } else {
        const errorMsg = result.error || "Failed to fetch content";
        set({ loading: false, error: errorMsg });
        return [];
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch content";
      set({ loading: false, error: errorMsg });
      return [];
    }
  },

  fetchContentById: async (userId, contentId) => {
    set({ loading: true, error: null });
    try {
      // Get token from auth state
      const state = get() as unknown as AuthState;
      const token = state.token;
      if (!token) {
        const errorMsg = "No authentication token available";
        set({ loading: false, error: errorMsg });
        return null;
      }

      const result = await getContentById(token, contentId);
      if (result.success && result.content) {
        const content = result.content as ContentItem;
        set({
          selectedContent: content,
          generatedContent: content as unknown as Record<string, unknown>,
          loading: false,
          error: null,
        });
        return content;
      } else {
        const errorMsg = result.error || "Failed to fetch content";
        set({ loading: false, error: errorMsg });
        return null;
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch content";
      set({ loading: false, error: errorMsg });
      return null;
    }
  },

  selectContent: (content) =>
    set({
      selectedContent: content,
      generatedContent: content as unknown as Record<string, unknown>,
      error: null,
    }),

  setGeneratedContent: (content) =>
    set({
      generatedContent: content,
    }),

  clearContent: () =>
    set({
      contentList: [],
      selectedContent: null,
      generatedContent: null,
      customization: {
        tone: "professional",
        length: "medium",
        hookStyle: "question",
        ctaStrength: "moderate",
        selectedPlatforms: [],
      },
    }),

  clearError: () => set({ error: null }),

  setError: (error) => set({ error }),
});

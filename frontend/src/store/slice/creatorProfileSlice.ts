import { StateCreator } from "zustand";
import {
  CreatorProfile,
  CreatorProfileData,
  getMyProfile,
  createCreatorProfile,
  updateCreatorProfile as updateProfileAPI,
  completeOnboarding as completeOnboardingAPI,
} from "@/lib/api/creatorProfile";

export type CreatorProfileSlice = {
  creatorProfile: CreatorProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  hasProfile: boolean;
  profileChecked: boolean;

  // Actions
  fetchProfile: (token: string) => Promise<void>;
  createProfile: (
    token: string,
    data: CreatorProfileData,
  ) => Promise<CreatorProfile>;
  updateProfile: (
    token: string,
    creatorId: string,
    data: Partial<CreatorProfileData>,
  ) => Promise<CreatorProfile>;
  completeOnboarding: (token: string, creatorId: string) => Promise<void>;
  clearProfile: () => void;
};

export const createCreatorProfileSlice: StateCreator<
  CreatorProfileSlice,
  [],
  [],
  CreatorProfileSlice
> = (set, get) => ({
  creatorProfile: null,
  profileLoading: false,
  profileError: null,
  hasProfile: false,
  profileChecked: false,

  fetchProfile: async (token: string) => {
    set({ profileLoading: true, profileError: null });

    try {
      const profile = await getMyProfile(token);

      set({
        creatorProfile: profile,
        hasProfile: profile !== null,
        profileChecked: true,
        profileLoading: false,
        profileError: null,
      });
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to fetch profile"
          : "Failed to fetch profile";

      set({
        creatorProfile: null,
        hasProfile: false,
        profileChecked: true,
        profileLoading: false,
        profileError: message,
      });
    }
  },

  createProfile: async (token: string, data: CreatorProfileData) => {
    set({ profileLoading: true, profileError: null });

    try {
      const profile = await createCreatorProfile(token, data);

      set({
        creatorProfile: profile,
        hasProfile: true,
        profileChecked: true,
        profileLoading: false,
        profileError: null,
      });

      return profile;
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message ||
            "Failed to create profile"
          : "Failed to create profile";

      set({
        profileLoading: false,
        profileError: message,
      });

      throw error;
    }
  },

  updateProfile: async (
    token: string,
    creatorId: string,
    data: Partial<CreatorProfileData>,
  ) => {
    set({ profileLoading: true, profileError: null });

    try {
      const updatedProfile = await updateProfileAPI(token, creatorId, data);

      set({
        creatorProfile: updatedProfile,
        profileLoading: false,
        profileError: null,
      });

      return updatedProfile;
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message ||
            "Failed to update profile"
          : "Failed to update profile";

      set({
        profileLoading: false,
        profileError: message,
      });

      throw error;
    }
  },

  completeOnboarding: async (token: string, creatorId: string) => {
    try {
      const updatedProfile = await completeOnboardingAPI(token, creatorId);

      set({
        creatorProfile: updatedProfile,
      });
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message ||
            "Failed to complete onboarding"
          : "Failed to complete onboarding";

      set({ profileError: message });
      throw error;
    }
  },

  clearProfile: () => {
    set({
      creatorProfile: null,
      profileLoading: false,
      profileError: null,
      hasProfile: false,
      profileChecked: false,
    });
  },
});

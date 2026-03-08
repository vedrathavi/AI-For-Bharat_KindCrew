import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthSlice, createAuthSlice } from "./slice/authSlice";
import {
  CreatorProfileSlice,
  createCreatorProfileSlice,
} from "./slice/creatorProfileSlice";
import { IdeationSlice, createIdeationSlice } from "./slice/ideationSlice";
import { ContentSlice, createContentSlice } from "./slice/contentSlice";

type AppState = AuthSlice & CreatorProfileSlice & IdeationSlice & ContentSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createCreatorProfileSlice(...args),
      ...createIdeationSlice(...args),
      ...createContentSlice(...args),
    }),
    {
      name: "kindcrew-app-storage",
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        authReady: state.authReady,
        creatorProfile: state.creatorProfile,
        hasProfile: state.hasProfile,
        profileChecked: state.profileChecked,
        ideas: state.ideas,
        profile: state.profile,
        contentList: state.contentList,
      }),
    },
  ),
);

export const useAuthStore = <T>(selector: (state: AppState) => T) =>
  useAppStore(selector);

export const useIdeationStore = <T>(selector: (state: AppState) => T) =>
  useAppStore(selector);

export const useContentStore = <T>(selector: (state: AppState) => T) =>
  useAppStore(selector);

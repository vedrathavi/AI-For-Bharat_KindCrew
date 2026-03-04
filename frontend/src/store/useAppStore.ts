import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthSlice, createAuthSlice } from "./slice/authSlice";
import {
  CreatorProfileSlice,
  createCreatorProfileSlice,
} from "./slice/creatorProfileSlice";

type AppState = AuthSlice & CreatorProfileSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createCreatorProfileSlice(...args),
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
      }),
    },
  ),
);

export const useAuthStore = <T>(selector: (state: AppState) => T) =>
  useAppStore(selector);

import { useAppStore } from "@/store/useAppStore";

export const useIdeation = () => {
  const ideas = useAppStore((state) => state.ideas);
  const selectedIdea = useAppStore((state) => state.selectedIdea);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const profile = useAppStore((state) => state.profile);

  const setProfile = useAppStore((state) => state.setProfile);
  const generateIdeas = useAppStore((state) => state.generateIdeas);
  const refineIdea = useAppStore((state) => state.refineIdea);
  const fetchUserIdeas = useAppStore((state) => state.fetchUserIdeas);
  const selectIdea = useAppStore((state) => state.selectIdea);
  const clearIdeas = useAppStore((state) => state.clearIdeas);
  const clearError = useAppStore((state) => state.clearError);
  const setError = useAppStore((state) => state.setError);

  return {
    // State
    ideas,
    selectedIdea,
    loading,
    error,
    profile,
    // Actions
    setProfile,
    generateIdeas,
    refineIdea,
    fetchUserIdeas,
    selectIdea,
    clearIdeas,
    clearError,
    setError,
  };
};

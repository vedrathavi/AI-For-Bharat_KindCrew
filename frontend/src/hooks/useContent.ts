import { useAppStore } from "@/store/useAppStore";

export const useContent = () => {
  const contentList = useAppStore((state) => state.contentList);
  const selectedContent = useAppStore((state) => state.selectedContent);
  const generatedContent = useAppStore((state) => state.generatedContent);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const customization = useAppStore((state) => state.customization);

  const setCustomization = useAppStore((state) => state.setCustomization);
  const createFromIdea = useAppStore((state) => state.createFromIdea);
  const createFromManual = useAppStore((state) => state.createFromManual);
  const fetchUserContent = useAppStore((state) => state.fetchUserContent);
  const fetchContentById = useAppStore((state) => state.fetchContentById);
  const selectContent = useAppStore((state) => state.selectContent);
  const setGeneratedContent = useAppStore((state) => state.setGeneratedContent);
  const clearContent = useAppStore((state) => state.clearContent);
  const clearError = useAppStore((state) => state.clearError);
  const setError = useAppStore((state) => state.setError);

  return {
    // State
    contentList,
    selectedContent,
    generatedContent,
    loading,
    error,
    customization,
    // Actions
    setCustomization,
    createFromIdea,
    createFromManual,
    fetchUserContent,
    fetchContentById,
    selectContent,
    setGeneratedContent,
    clearContent,
    clearError,
    setError,
  };
};

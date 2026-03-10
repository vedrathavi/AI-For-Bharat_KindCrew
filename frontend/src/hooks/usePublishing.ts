import { useAppStore } from "@/store/useAppStore";

export function usePublishing() {
  const schedules = useAppStore((state) => state.schedules);
  const loading = useAppStore((state) => state.schedulesLoading);
  const error = useAppStore((state) => state.schedulesError);
  const suggestedTimes = useAppStore((state) => state.suggestedTimes);
  const suggestLoading = useAppStore((state) => state.suggestLoading);
  const fetchSchedules = useAppStore((state) => state.fetchSchedules);
  const createSchedule = useAppStore((state) => state.createSchedule);
  const updateSchedule = useAppStore((state) => state.updateSchedule);
  const deleteSchedule = useAppStore((state) => state.deleteSchedule);
  const getSuggestedTimes = useAppStore((state) => state.getSuggestedTimes);
  const clearSuggestedTimes = useAppStore((state) => state.clearSuggestedTimes);

  return {
    schedules,
    loading,
    error,
    suggestedTimes,
    suggestLoading,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSuggestedTimes,
    clearSuggestedTimes,
  };
}

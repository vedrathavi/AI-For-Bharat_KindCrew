import { StateCreator } from "zustand";
import {
  CreateEventPayload,
  ScheduleRecord,
  SuggestTimePayload,
  SuggestTimeResult,
  createScheduleEvent,
  getScheduleEvents,
  updateScheduleEvent,
  deleteScheduleEvent,
  suggestPostingTime,
} from "@/lib/api/publishing";

export type PublishingSlice = {
  schedules: ScheduleRecord[];
  schedulesLoading: boolean;
  schedulesError: string | null;
  suggestedTimes: SuggestTimeResult | null;
  suggestLoading: boolean;

  fetchSchedules: (token: string) => Promise<void>;
  createSchedule: (
    token: string,
    payload: CreateEventPayload,
  ) => Promise<ScheduleRecord>;
  updateSchedule: (
    token: string,
    id: string,
    updates: Partial<CreateEventPayload>,
  ) => Promise<ScheduleRecord>;
  deleteSchedule: (token: string, id: string) => Promise<void>;
  getSuggestedTimes: (
    token: string,
    payload: SuggestTimePayload,
  ) => Promise<SuggestTimeResult>;
  clearSuggestedTimes: () => void;
};

export const createPublishingSlice: StateCreator<
  PublishingSlice,
  [],
  [],
  PublishingSlice
> = (set, get) => ({
  schedules: [],
  schedulesLoading: false,
  schedulesError: null,
  suggestedTimes: null,
  suggestLoading: false,

  fetchSchedules: async (token: string) => {
    set({ schedulesLoading: true, schedulesError: null });
    try {
      const items = await getScheduleEvents(token);
      set({ schedules: items, schedulesLoading: false });
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || "Failed to fetch schedules"
          : "Failed to fetch schedules";
      set({ schedulesLoading: false, schedulesError: message });
    }
  },

  createSchedule: async (token: string, payload: CreateEventPayload) => {
    set({ schedulesLoading: true, schedulesError: null });
    try {
      const sched = await createScheduleEvent(token, payload);
      set((state) => ({
        schedules: [sched, ...state.schedules],
        schedulesLoading: false,
      }));
      return sched;
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || "Failed to create schedule"
          : "Failed to create schedule";
      set({ schedulesLoading: false, schedulesError: message });
      throw err;
    }
  },

  updateSchedule: async (
    token: string,
    id: string,
    updates: Partial<CreateEventPayload>,
  ) => {
    set({ schedulesLoading: true, schedulesError: null });
    try {
      const updated = await updateScheduleEvent(token, id, updates);
      set((state) => ({
        schedules: state.schedules.map((s) => (s.eventId === id ? updated : s)),
        schedulesLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || "Failed to update schedule"
          : "Failed to update schedule";
      set({ schedulesLoading: false, schedulesError: message });
      throw err;
    }
  },

  deleteSchedule: async (token: string, id: string) => {
    set({ schedulesLoading: true, schedulesError: null });
    try {
      await deleteScheduleEvent(token, id);
      set((state) => ({
        schedules: state.schedules.filter((s) => s.eventId !== id),
        schedulesLoading: false,
      }));
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || "Failed to delete schedule"
          : "Failed to delete schedule";
      set({ schedulesLoading: false, schedulesError: message });
      throw err;
    }
  },

  getSuggestedTimes: async (token: string, payload: SuggestTimePayload) => {
    set({ suggestLoading: true });
    try {
      const result = await suggestPostingTime(token, payload);
      set({ suggestedTimes: result, suggestLoading: false });
      return result;
    } catch (err: unknown) {
      set({ suggestLoading: false });
      throw err;
    }
  },

  clearSuggestedTimes: () => set({ suggestedTimes: null }),
});

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePublishing } from "@/hooks/usePublishing";
import { useToast } from "@/hooks/useToast";
import type { ScheduleRecord, SuggestedTimeSlot } from "@/lib/api/publishing";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  FiAlertTriangle,
  FiCalendar,
  FiChevronRight,
  FiEdit3,
  FiEye,
  FiGlobe,
  FiLink,
  FiPlus,
  FiTrash2,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useAppStore } from "@/store/useAppStore";

const PLATFORMS = [
  "LinkedIn",
  "Twitter/X",
  "Instagram",
  "YouTube",
  "Facebook",
  "Blog",
];

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
];

function formatLongDate(date: Date) {
  const n = date.getDate();
  const suffixes = ["th", "st", "nd", "rd"];
  const value = n % 100;
  const ord =
    n + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
  return `${date.toLocaleString(undefined, { month: "long" })} ${ord}, ${date.getFullYear()}`;
}

function dayKey(date: Date | string) {
  return new Date(date).toDateString();
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    scheduled: "bg-blue-900/70 text-blue-200 border border-blue-700/60",
    completed:
      "bg-emerald-900/70 text-emerald-200 border border-emerald-700/60",
    cancelled: "bg-red-900/70 text-red-200 border border-red-700/60",
  };
  return (
    map[status] ?? "bg-neutral-800 text-neutral-300 border border-neutral-700"
  );
}

function getNextDateForDay(day: string, time: string) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const targetDay = days.indexOf(day);
  if (targetDay === -1) return null;

  const next = new Date();
  const diff = (targetDay - next.getDay() + 7) % 7 || 7;
  next.setDate(next.getDate() + diff);

  const [hour, minute] = time.split(":").map((value) => Number(value));
  if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
    next.setHours(hour, minute, 0, 0);
  }

  return next;
}

function formatSuggestionDate(day: string, time: string) {
  const next = getNextDateForDay(day, time);
  if (!next) return `${day} ${time}`;

  return next.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScheduleTime(iso: string, tz = "Asia/Kolkata") {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

function formatScheduleDateTime(iso: string, tz = "Asia/Kolkata") {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });
}

function getLocalDateTimeParts(iso: string, tz: string) {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value || "00";

  const localDate = `${value("year")}-${value("month")}-${value("day")}`;
  const localTime = `${value("hour")}:${value("minute")}`;
  return { localDate, localTime };
}

function getScheduleTitle(schedule: ScheduleRecord) {
  return schedule.contentSnapshot?.title || schedule.platform;
}

function getDraftText(draft: unknown) {
  if (typeof draft === "string") {
    return draft;
  }

  if (draft && typeof draft === "object" && "text" in draft) {
    const text = (draft as { text?: unknown }).text;
    return typeof text === "string" ? text : "";
  }

  return "";
}

export default function PlanningPage() {
  const router = useRouter();
  const toast = useToast();
  const { token, isAuthenticated, userInfo } = useAuth();
  const {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    suggestedTimes,
    suggestLoading,
    getSuggestedTimes,
    clearSuggestedTimes,
  } = usePublishing();

  const contentList = useAppStore((state) => state.contentList);
  const fetchUserContent = useAppStore((state) => state.fetchUserContent);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDayActionModal, setShowDayActionModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleRecord | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );
  const [source, setSource] = useState<"generated" | "manual">("manual");
  const [selectedContentId, setSelectedContentId] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualText, setManualText] = useState("");
  const [manualMediaUrl, setManualMediaUrl] = useState("");
  const [platform, setPlatform] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("10:00");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (token && isAuthenticated()) {
      fetchSchedules(token);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (token && isAuthenticated() && userInfo?.userId) {
      fetchUserContent(userInfo.userId);
    }
  }, [token, userInfo?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, ScheduleRecord[]>();
    schedules.forEach((schedule) => {
      const key = dayKey(schedule.scheduledAt);
      const current = map.get(key) || [];
      current.push(schedule);
      current.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
      map.set(key, current);
    });
    return map;
  }, [schedules]);

  const selectedDateSchedules = useMemo(
    () => schedulesByDay.get(dayKey(selectedDate)) || [],
    [schedulesByDay, selectedDate],
  );

  const todaySchedules = useMemo(
    () => schedulesByDay.get(dayKey(new Date())) || [],
    [schedulesByDay],
  );

  const upcomingWeekSchedules = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const end = new Date(todayStart);
    end.setDate(end.getDate() + 7);

    return [...schedules]
      .filter((schedule) => {
        const date = new Date(schedule.scheduledAt);
        return date > now && date <= end && dayKey(date) !== dayKey(todayStart);
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
  }, [schedules]);

  const openScheduleModal = useCallback(
    (
      date?: Date,
      prefill?: { contentId?: string; source?: "generated" | "manual" },
    ) => {
      clearSuggestedTimes();
      setFormError("");
      setShowDayActionModal(false);
      setEditingScheduleId(null);
      const nextDate = date || selectedDate;
      setSchedDate(nextDate.toISOString().slice(0, 10));
      setSchedTime("10:00");
      if (prefill?.contentId) {
        setSource("generated");
        setSelectedContentId(prefill.contentId);
      } else {
        setSource(prefill?.source || "manual");
        setSelectedContentId("");
      }
      setPlatform("");
      setManualTitle("");
      setManualText("");
      setManualMediaUrl("");
      setShowScheduleModal(true);
    },
    [clearSuggestedTimes, selectedDate],
  );

  const openEditScheduleModal = (schedule: ScheduleRecord) => {
    clearSuggestedTimes();
    setFormError("");
    setShowDayActionModal(false);
    setEditingScheduleId(schedule.eventId);

    const timeZone = schedule.timezone || "Asia/Kolkata";
    const { localDate, localTime } = getLocalDateTimeParts(
      schedule.scheduledAt,
      timeZone,
    );

    setSource(schedule.source === "generated" ? "generated" : "manual");
    setSelectedContentId(schedule.contentId || "");
    setManualTitle(schedule.contentSnapshot?.title || "");
    setManualText(schedule.contentSnapshot?.text || "");
    setManualMediaUrl("");
    setPlatform(schedule.platform || "");
    setTimezone(timeZone);
    setSchedDate(localDate);
    setSchedTime(localTime);
    setShowScheduleModal(true);
  };

  const handleCalendarDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayActionModal(true);
  };

  const handleSchedDateChange = (value: string) => {
    setSchedDate(value);
    if (value) {
      setSelectedDate(new Date(`${value}T00:00:00`));
    }
  };

  const handleSchedTimeChange = (value: string) => {
    setSchedTime(value);
  };

  const handleSuggest = async () => {
    if (!token || !platform) return;
    const selectedContent = contentList.find(
      (content) => content.contentId === selectedContentId,
    );
    const topic = source === "generated" ? selectedContent?.topic : manualTitle;

    try {
      await getSuggestedTimes(token, {
        platform,
        topic: topic || "",
        timezone,
      });
    } catch (suggestError) {
      toast.error(
        "Could not fetch time suggestions",
        suggestError instanceof Error ? suggestError.message : undefined,
      );
    }
  };

  const applySlot = (slot: SuggestedTimeSlot) => {
    setSchedTime(slot.time);
    const next = getNextDateForDay(slot.day, slot.time);
    if (!next) return;
    setSchedDate(next.toISOString().slice(0, 10));
    setSelectedDate(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError("");
    const isEditing = Boolean(editingScheduleId);

    if (!platform || !schedDate || !schedTime) {
      setFormError("Platform, date, and time are required.");
      return;
    }

    if (!isEditing && source === "generated" && !selectedContentId) {
      setFormError("Please select a content item.");
      return;
    }

    if (!isEditing && source === "manual" && !manualTitle && !manualText) {
      setFormError("Please provide a title or content text.");
      return;
    }

    const selectedContent = contentList.find(
      (content) => content.contentId === selectedContentId,
    );
    const draftText = getDraftText(selectedContent?.draft);

    try {
      if (isEditing && editingScheduleId) {
        await updateSchedule(token, editingScheduleId, {
          platform,
          scheduledDate: schedDate,
          scheduledTime: schedTime,
          timezone,
        });
        setShowScheduleModal(false);
        setEditingScheduleId(null);
        toast.success(
          "Schedule updated",
          `Updated to ${schedDate} at ${schedTime}.`,
        );
      } else {
        await createSchedule(token, {
          source,
          contentId: source === "generated" ? selectedContentId : undefined,
          platform,
          title: source === "generated" ? selectedContent?.topic : manualTitle,
          contentText: source === "generated" ? draftText : manualText,
          mediaUrl: manualMediaUrl || undefined,
          scheduledDate: schedDate,
          scheduledTime: schedTime,
          timezone,
          contentSnapshot: {
            title:
              source === "generated"
                ? (selectedContent?.topic ?? null)
                : manualTitle || null,
            text:
              source === "generated" ? draftText || null : manualText || null,
          },
        });

        setShowScheduleModal(false);
        toast.success(
          "Post scheduled",
          `Confirmation email will be sent for ${schedDate} at ${schedTime}.`,
        );
      }
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to schedule post",
      );
    }
  };

  const requestDeleteEvent = (schedule: ScheduleRecord) => {
    setDeleteTarget(schedule);
  };

  const confirmDeleteEvent = async () => {
    if (!token || !deleteTarget) return;

    try {
      await deleteSchedule(token, deleteTarget.eventId);
      toast.success(
        "Event cancelled",
        "Reminder rule removed and cancellation email queued.",
      );
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error(
        "Could not cancel event",
        deleteError instanceof Error ? deleteError.message : undefined,
      );
    }
  };

  const viewScheduleDetails = (schedule: ScheduleRecord) => {
    setShowDayActionModal(false);

    if (schedule.contentId) {
      router.push(`/content/${schedule.contentId}`);
      return;
    }

    toast.info(
      "Manual post",
      "This event was created manually, so only the schedule summary is available here.",
    );
  };

  const renderScheduleCard = (
    schedule: ScheduleRecord,
    options?: {
      showDate?: boolean;
      compact?: boolean;
      showViewButton?: boolean;
    },
  ) => {
    const showDate = options?.showDate ?? false;
    const compact = options?.compact ?? false;
    const showViewButton = options?.showViewButton ?? false;

    return (
      <div
        key={schedule.eventId}
        className={`rounded-2xl border border-neutral-800 bg-black/70 ${
          compact ? "p-3" : "p-4"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-bold text-white">
            {schedule.platform.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {getScheduleTitle(schedule)}
            </p>
            <p className="mt-1 text-xs text-neutral-300">
              {showDate
                ? formatScheduleDateTime(
                    schedule.scheduledAt,
                    schedule.timezone || "Asia/Kolkata",
                  )
                : formatScheduleTime(
                    schedule.scheduledAt,
                    schedule.timezone || "Asia/Kolkata",
                  )}
            </p>
            {schedule.contentSnapshot?.text && (
              <p
                className={`mt-2 text-xs text-neutral-400 ${
                  compact ? "line-clamp-3" : "line-clamp-2"
                }`}
              >
                {schedule.contentSnapshot.text}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${statusBadge(schedule.status)}`}
          >
            {schedule.status}
          </span>
          <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-300 capitalize">
            {schedule.source}
          </span>
          <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-300">
            {schedule.platform}
          </span>
          <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-300">
            {schedule.timezone || "Asia/Kolkata"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => openEditScheduleModal(schedule)}
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-500"
            title="Edit schedule"
          >
            <span className="inline-flex items-center gap-1">
              <FiEdit3 size={12} /> Edit
            </span>
          </button>
          {showViewButton && (
            <button
              onClick={() => viewScheduleDetails(schedule)}
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-500"
            >
              <span className="inline-flex items-center gap-1">
                <FiEye size={12} /> View
              </span>
            </button>
          )}
          <button
            onClick={() => requestDeleteEvent(schedule)}
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-red-700 hover:text-red-300"
            title="Cancel event"
          >
            <span className="inline-flex items-center gap-1">
              <FiTrash2 size={12} /> Cancel
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <FiCalendar className="text-gray-400" size={32} />
          <div>
            <h1 className="text-3xl font-bold">Planning &amp; Scheduling</h1>
            <p className="mt-1 text-gray-400">
              Schedule content, review this week, and keep reminders aligned.
            </p>
          </div>
        </div>
        <button
          onClick={() => openScheduleModal()}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 font-medium text-black shadow-sm transition-colors hover:bg-gray-100"
        >
          <FiPlus size={18} /> Schedule Post
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-700 bg-red-900/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[28px] border border-neutral-800 bg-linear-to-b from-neutral-950 to-neutral-900 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-neutral-400" size={18} />
                <p className="text-lg font-semibold text-white">
                  Content Calendar
                </p>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                Tap a date to open actions or inspect scheduled activity.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-black/60 px-4 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                Selected day
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatLongDate(selectedDate)}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-black/70 p-3">
            <Calendar
              onChange={(value) => {
                if (value && !Array.isArray(value)) {
                  setSelectedDate(value as Date);
                }
              }}
              onClickDay={handleCalendarDayClick}
              value={selectedDate}
              className="w-full planning-calendar"
              tileClassName={({ date, view }) => {
                if (view !== "month") return undefined;
                const count = schedulesByDay.get(dayKey(date))?.length || 0;
                if (!count) return undefined;
                return count > 1
                  ? "planning-calendar-tile--busy"
                  : "planning-calendar-tile--scheduled";
              }}
              tileContent={({ date, view }) => {
                if (view !== "month") return null;
                const daySchedules = schedulesByDay.get(dayKey(date)) || [];
                if (!daySchedules.length) return null;

                return (
                  <div className="pointer-events-none mt-1 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      {daySchedules.slice(0, 3).map((schedule) => (
                        <span
                          key={schedule.eventId}
                          className="h-1.5 w-1.5 rounded-full bg-amber-400"
                        />
                      ))}
                    </div>
                    <span className="rounded-full bg-neutral-800/90 px-1.5 py-0.5 text-[9px] font-medium text-neutral-300">
                      {daySchedules.length} scheduled
                    </span>
                  </div>
                );
              }}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-neutral-800 bg-linear-to-b from-neutral-950 to-neutral-900 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
              Today
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Today&apos;s scheduled posts
            </h2>
          </div>

          {todaySchedules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 bg-black/50 p-4 text-sm text-neutral-500">
              Nothing scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((schedule) =>
                renderScheduleCard(schedule, {
                  compact: true,
                  showViewButton: true,
                }),
              )}
            </div>
          )}

          <div className="border-t border-neutral-800 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  This week
                </p>
                <h3 className="mt-1 text-base font-semibold text-white">
                  Upcoming this week
                </h3>
              </div>
              <span className="rounded-full border border-neutral-800 bg-black/60 px-2.5 py-1 text-[10px] text-neutral-400">
                {upcomingWeekSchedules.length} queued
              </span>
            </div>

            {upcomingWeekSchedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-black/50 p-4 text-sm text-neutral-500">
                No upcoming posts in the next 7 days.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingWeekSchedules.map((schedule) =>
                  renderScheduleCard(schedule, {
                    compact: true,
                    showDate: true,
                    showViewButton: true,
                  }),
                )}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-800 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  Selected day
                </p>
                <h3 className="mt-1 text-base font-semibold text-white">
                  {formatLongDate(selectedDate)}
                </h3>
              </div>
              <button
                onClick={() => setShowDayActionModal(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-700 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-500"
              >
                Open actions <FiChevronRight size={14} />
              </button>
            </div>

            {selectedDateSchedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-black/50 p-4 text-sm text-neutral-500">
                No posts scheduled for this date yet.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSchedules.map((schedule) =>
                  renderScheduleCard(schedule, {
                    compact: true,
                    showViewButton: true,
                  }),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-neutral-800 bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <FiLink className="text-gray-400" size={16} />
          <h2 className="text-base font-semibold">Saved Generated Content</h2>
        </div>

        {contentList.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">
            No saved generated content yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {contentList.map((item) => (
              <div
                key={item.contentId}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.topic}</p>
                  <p className="mt-0.5 text-xs capitalize text-gray-500">
                    {item.contentType}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() =>
                      openScheduleModal(selectedDate, {
                        contentId: item.contentId,
                        source: "generated",
                      })
                    }
                    className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => router.push(`/content/${item.contentId}`)}
                    className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-500"
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-black shadow-sm transition-colors hover:bg-gray-100"
          onClick={() => router.push("/analytics")}
        >
          Continue to Analytics <span className="text-lg">→</span>
        </button>
      </div>

      {showDayActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-neutral-800 bg-neutral-950 shadow-[0_35px_120px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  Date actions
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {formatLongDate(selectedDate)}
                </h2>
              </div>
              <button
                onClick={() => setShowDayActionModal(false)}
                className="p-2 text-neutral-500 transition-colors hover:text-white"
                title="Close day actions"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-neutral-800 bg-black/60 p-4">
                <p className="text-sm text-neutral-300">
                  Choose whether to schedule a new post on this day or inspect
                  the posts already assigned here.
                </p>
                <button
                  onClick={() => openScheduleModal(selectedDate)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
                >
                  <FiPlus size={16} /> Schedule post on this day
                </button>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Scheduled on this date
                  </h3>
                  <span className="text-xs text-neutral-500">
                    {selectedDateSchedules.length} event
                    {selectedDateSchedules.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {selectedDateSchedules.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-800 bg-black/50 p-4 text-sm text-neutral-500">
                    No posts are scheduled here yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateSchedules.map((schedule) =>
                      renderScheduleCard(schedule, {
                        compact: true,
                        showViewButton: true,
                      }),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-neutral-800 bg-neutral-950 shadow-[0_35px_120px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-5">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-400" size={20} />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {editingScheduleId ? "Edit Schedule" : "Schedule Post"}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Selected date:{" "}
                    {formatLongDate(
                      new Date(
                        `${schedDate || selectedDate.toISOString().slice(0, 10)}T00:00:00`,
                      ),
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingScheduleId(null);
                }}
                className="p-2 text-neutral-500 transition-colors hover:text-white"
                title="Close schedule modal"
                aria-label="Close schedule modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Content Source
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSource("generated")}
                    disabled={Boolean(editingScheduleId)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      source === "generated"
                        ? "border-blue-600 bg-blue-900 text-blue-200"
                        : "border-border bg-background text-gray-400 hover:text-white"
                    } ${editingScheduleId ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <FiLink size={13} className="mr-1.5 inline" />
                    From Generated Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource("manual")}
                    disabled={Boolean(editingScheduleId)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      source === "manual"
                        ? "border-neutral-600 bg-neutral-800 text-white"
                        : "border-border bg-background text-gray-400 hover:text-white"
                    } ${editingScheduleId ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <FiEdit3 size={13} className="mr-1.5 inline" />
                    Write Custom
                  </button>
                </div>
              </div>

              {source === "generated" && (
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">
                    Select Content *
                  </label>
                  {contentList.length === 0 ? (
                    <p className="text-xs italic text-gray-500">
                      No generated content yet. Go to Ideation to create some.
                    </p>
                  ) : (
                    <select
                      value={selectedContentId}
                      onChange={(e) => setSelectedContentId(e.target.value)}
                      title="Select generated content"
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm text-white focus:outline-none"
                    >
                      <option value="">— choose —</option>
                      {contentList.map((content) => (
                        <option
                          key={content.contentId}
                          value={content.contentId}
                        >
                          {content.topic} ({content.contentType})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {source === "manual" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-400">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="AI tools founders should use"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-400">
                      Content Text *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Most founders waste hours on content…"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-400">
                      Media URL (optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://…"
                      value={manualMediaUrl}
                      onChange={(e) => setManualMediaUrl(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-sm text-gray-400">
                  Platform *
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  title="Select platform"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-white focus:outline-none"
                >
                  <option value="">— choose platform —</option>
                  {PLATFORMS.map((platformName) => (
                    <option key={platformName} value={platformName}>
                      {platformName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-400">
                  <FiGlobe size={12} className="mr-1 inline" />
                  Timezone *
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  title="Select timezone"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-white focus:outline-none"
                >
                  {TIMEZONES.map((timeZone) => (
                    <option key={timeZone} value={timeZone}>
                      {timeZone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-black px-4 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
                      <FiZap size={14} className="text-neutral-300" />
                      AI Best Time Suggestions
                    </span>
                    <p className="mt-1 text-[11px] text-neutral-500">
                      Best next-slot picks for {platform || "your platform"}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSuggest}
                    disabled={!platform || suggestLoading}
                    className="rounded-xl bg-neutral-100 px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-white disabled:opacity-40"
                  >
                    {suggestLoading ? "Thinking…" : "Suggest"}
                  </button>
                </div>

                {!platform && (
                  <p className="text-xs text-neutral-500">
                    Select a platform first.
                  </p>
                )}

                {suggestedTimes && (
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {suggestedTimes.suggestedTimes.map((slot, index) => (
                      <button
                        key={`${slot.day}-${slot.time}-${index}`}
                        type="button"
                        onClick={() => applySlot(slot)}
                        title={
                          slot.reason ||
                          "AI-picked timing based on audience behavior"
                        }
                        className="group rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-left transition-all hover:border-neutral-600 hover:bg-neutral-900"
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                          Suggested slot
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-100">
                          {formatSuggestionDate(slot.day, slot.time)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {slot.reason || "Fits expected engagement behavior."}
                        </p>
                        <p className="mt-2 text-[11px] font-medium text-neutral-500 group-hover:text-neutral-300">
                          Apply this time
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => handleSchedDateChange(e.target.value)}
                    onInput={(e) =>
                      handleSchedDateChange(
                        (e.target as HTMLInputElement).value,
                      )
                    }
                    title="Select schedule date"
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-gray-400">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={(e) => handleSchedTimeChange(e.target.value)}
                    onInput={(e) =>
                      handleSchedTimeChange(
                        (e.target as HTMLInputElement).value,
                      )
                    }
                    title="Select schedule time"
                    step={60}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingScheduleId(null);
                  }}
                  className="rounded-xl bg-gray-700 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-black shadow-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  {loading
                    ? "Saving…"
                    : editingScheduleId
                      ? "Save changes"
                      : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-neutral-800 bg-neutral-950 shadow-[0_35px_120px_rgba(0,0,0,0.5)]">
            <div className="border-b border-neutral-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-red-800 bg-red-950/50 p-3 text-red-300">
                  <FiAlertTriangle size={18} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    Cancel scheduled event?
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    This removes the reminder and sends a cancellation
                    confirmation email.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div className="rounded-2xl border border-neutral-800 bg-black/60 p-4">
                <p className="text-sm font-semibold text-white">
                  {getScheduleTitle(deleteTarget)}
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                  {formatScheduleDateTime(
                    deleteTarget.scheduledAt,
                    deleteTarget.timezone || "Asia/Kolkata",
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500"
                >
                  Keep event
                </button>
                <button
                  onClick={confirmDeleteEvent}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
                >
                  Cancel event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}

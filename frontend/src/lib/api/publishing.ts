/**
 * Publishing API client
 * communicates with backend scheduling endpoints
 */
import { API_URL } from "@/lib/constants";
import { buildApiUrl } from "@/lib/constants";

const API_BASE = API_URL
  ? `${API_URL.replace(/\/$/, "").replace(/\/api$/, "")}/api`
  : "/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentSnapshot = {
  title: string | null;
  text: string | null;
};

/** Payload for POST /schedule/create */
export type CreateEventPayload = {
  source: "generated" | "manual";
  contentId?: string; // required when source=generated
  platform: string;
  title?: string; // manual source
  contentText?: string; // manual source
  mediaUrl?: string;
  scheduledDate: string; // e.g. "2026-03-12"
  scheduledTime: string; // e.g. "10:30"
  timezone: string; // IANA, e.g. "Asia/Kolkata"
  contentSnapshot?: ContentSnapshot;
};

/** A scheduled event returned from the API */
export type ScheduleRecord = {
  eventId: string;
  userId: string;
  source: "generated" | "manual";
  contentId: string | null;
  platform: string;
  contentSnapshot: ContentSnapshot;
  scheduledAt: string; // UTC ISO
  timezone: string;
  status: "scheduled" | "completed" | "cancelled";
  notification: { emailSent: boolean };
  createdAt: string;
  updatedAt: string;
};

export type SuggestTimePayload = {
  platform: string;
  topic?: string;
  timezone?: string;
};

export type SuggestedTimeSlot = {
  day: string;
  time: string;
  reason?: string;
};
export type SuggestTimeResult = { suggestedTimes: SuggestedTimeSlot[] };

async function handleResponse(res: Response) {
  const url = res.url;
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Unexpected response from ${url}: ${text}`);
  }

  if (!res.ok) {
    const msg = data.error || data.message || `HTTP ${res.status}`;
    throw new Error(`${msg} (${res.status} @ ${url})`);
  }

  return data.data;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function createScheduleEvent(
  token: string,
  payload: CreateEventPayload,
): Promise<ScheduleRecord> {
  const res = await fetch(`${API_BASE}/schedule/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getScheduleEvents(
  token: string,
): Promise<ScheduleRecord[]> {
  const url = `${API_BASE}/schedule/events`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function getScheduleEvent(
  token: string,
  eventId: string,
): Promise<ScheduleRecord> {
  const res = await fetch(`${API_BASE}/schedule/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updateScheduleEvent(
  token: string,
  eventId: string,
  updates: Partial<CreateEventPayload>,
): Promise<ScheduleRecord> {
  const res = await fetch(`${API_BASE}/schedule/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventId, ...updates }),
  });
  return handleResponse(res);
}

export async function deleteScheduleEvent(
  token: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/schedule/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Delete failed (${res.status}): ${text}`);
  }
}

export async function suggestPostingTime(
  token: string,
  payload: SuggestTimePayload,
): Promise<SuggestTimeResult> {
  const endpoint = buildApiUrl("/api/schedule/suggest-time");
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Network error: backend unreachable at ${endpoint}. Check NEXT_PUBLIC_API_URL and backend server status.`,
      );
    }
    throw error;
  }
}

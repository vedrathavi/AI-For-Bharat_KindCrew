
/**
 * Publishing API client
 * communicates with backend scheduling endpoints
 */
import { API_URL } from "@/lib/constants";

const API_BASE = `${API_URL.replace(/\/$/, "").replace(/\/api$/, "")}/api`;

export type SchedulePayload = {
  contentId: string;
  platform: string;
  scheduledTime: string; // ISO
  autoPost?: boolean;
  formattedContent?: {
    title?: string;
    caption?: string;
    hashtags?: string[];
    tags?: string[];
  };
};

export type ScheduleRecord = SchedulePayload & {
  scheduleId: string;
  userId: string;
  status: string;
  postResult: any;
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
};

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

export async function scheduleContent(
  token: string,
  payload: SchedulePayload,
): Promise<ScheduleRecord> {
  const res = await fetch(`${API_BASE}/publishing/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getSchedules(
  token: string,
): Promise<ScheduleRecord[]> {
  const url = `${API_BASE}/publishing/scheduled`;
  console.debug("[API] GET schedules ->", url);
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updateSchedule(
  token: string,
  scheduleId: string,
  updates: Partial<SchedulePayload>,
): Promise<ScheduleRecord> {
  const res = await fetch(`${API_BASE}/publishing/${scheduleId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function postNow(
  token: string,
  scheduleId: string,
): Promise<ScheduleRecord> {
  const res = await fetch(`${API_BASE}/publishing/${scheduleId}/post`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

export async function addCalendarEvent(
  token: string,
  scheduleId: string,
  accessToken: string,
): Promise<any> {
  const res = await fetch(`${API_BASE}/publishing/${scheduleId}/calendar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ accessToken }),
  });
  return handleResponse(res);
}

import { API_URL } from "@/lib/constants";
import { authenticatedFetch as fetch } from "@/lib/apiClient";
import { ResearchSnapshot } from "@/types/research";

const API_BASE_URL = API_URL || "";

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data = await response.json();
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  } catch {
    // Ignore JSON parse errors
  }
  return `${fallbackMessage} (${response.status} ${response.statusText})`;
}

/**
 * Execute explicit controlled refresh for an existing research snapshot (V1 -> V2)
 */
export async function refreshResearch(
  token: string,
  snapshotId: string
): Promise<{
  success: boolean;
  newSnapshotId?: string;
  requestHash?: string;
  research?: ResearchSnapshot;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/refresh-research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ snapshotId }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to refresh research snapshot")
    );
  }

  return response.json();
}

/**
 * Fetch past research sessions history for user
 */
export async function getUserResearchHistory(
  token: string
): Promise<{
  success: boolean;
  history: ResearchSnapshot[];
  count: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ideation/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch research history")
    );
  }

  return response.json();
}

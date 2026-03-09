import { API_URL } from "@/lib/constants";

const API_BASE_URL = API_URL || "";

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data = await response.json();
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  } catch {
    // Ignore JSON parse errors and fall back to status text.
  }

  return `${fallbackMessage} (${response.status} ${response.statusText})`;
}

/**
 * Create content from Phase 1 idea
 */
export async function createContentFromIdea(
  token: string,
  ideaId: string,
  options?: {
    ideaUserId?: string;
    platforms?: string[];
    preferences?: {
      tone?: string;
      length?: string;
      includeCTA?: boolean;
    };
    contentType?: string;
    goal?: string;
  },
) {
  const response = await fetch(`${API_BASE_URL}/api/content/from-idea`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ ideaId, ...options }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to create content from idea"),
    );
  }

  return response.json();
}

/**
 * Create content from manual input
 */
export async function createContentFromManual(
  token: string,
  contentData: Record<string, unknown>,
) {
  const response = await fetch(`${API_BASE_URL}/api/content/from-manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ ...contentData }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        "Failed to create content from manual input",
      ),
    );
  }

  return response.json();
}

/**
 * Get specific content by ID
 */
export async function getContentById(token: string, contentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/content/${contentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch content"),
    );
  }

  return response.json();
}

/**
 * Get all content for a user
 */
export async function getUserContent(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/content/user`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to fetch user content"),
    );
  }

  return response.json();
}

/**
 * Generate outline only (for preview)
 */
export async function generateOutline(token: string, contentData: any) {
  const response = await fetch(`${API_BASE_URL}/api/content/generate-outline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(contentData),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to generate outline"),
    );
  }

  return response.json();
}

/**
 * Generate draft only (for preview)
 */
export async function generateDraft(
  token: string,
  outline: any,
  contentData: any,
) {
  const response = await fetch(`${API_BASE_URL}/api/content/generate-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ outline, ...contentData }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to generate draft"),
    );
  }

  return response.json();
}

/**
 * Regenerate variant for specific platform
 */
export async function regenerateVariant(
  token: string,
  contentId: string,
  platform: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/content/regenerate-variant`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ contentId, platform }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to regenerate variant");
  }

  return response.json();
}

/**
 * Update distribution status
 */
export async function updateDistributionStatus(
  token: string,
  contentId: string,
  status: "draft" | "scheduled" | "published",
  scheduledAt?: string,
) {
  const response = await fetch(`${API_BASE_URL}/api/content/update-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ contentId, status, scheduledAt }),
  });

  if (!response.ok) {
    throw new Error("Failed to update distribution status");
  }

  return response.json();
}

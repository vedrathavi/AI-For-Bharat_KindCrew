/**
 * Creator Profile API Service
 * Handles all API calls related to creator profiles
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE = `${API_URL.replace(/\/$/, "").replace(/\/api$/, "")}/api`;

export type Platform = {
  name: string;
  handle: string;
  active: boolean;
};

export type CreatorProfileData = {
  niche: {
    primary: string;
    secondary?: string;
  };
  platforms?: Platform[];
  goals: {
    primaryGoal: "growth" | "monetization" | "engagement" | "brand-building";
    creatorLevel: "beginner" | "intermediate" | "advanced";
  };
  strategy: {
    contentStrategy: "educational" | "entertainment" | "promotional";
    postingFrequency: string;
    contentPillars: string[];
  };
  preferences?: {
    tones?: string[];
    formats?: string[];
    constraints?: {
      emojiUsage?: boolean;
      ctaStrength?: "weak" | "medium" | "strong";
      formality?: "formal" | "semi-formal" | "casual";
    };
    timeCommitment?: "low" | "medium" | "high";
  };
  competitors?: Array<{
    competitorId: string;
    name: string;
    url: string;
    notes?: string;
  }>;
};

export type CreatorProfile = CreatorProfileData & {
  creatorId: string;
  userId: string;
  settings: {
    onboardingCompleted: boolean;
  };
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
};

/**
 * Create a new creator profile
 */
export async function createCreatorProfile(
  token: string,
  profileData: CreatorProfileData,
): Promise<CreatorProfile> {
  try {
    console.log("🌐 [API] Creating profile - sending to backend:", {
      competitors: profileData.competitors,
      platforms: profileData.platforms,
      niche: profileData.niche,
      fullData: JSON.stringify(profileData),
    });

    const response = await fetch(`${API_BASE}/creator-profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = `Failed to create profile (HTTP ${response.status})`;

      try {
        const parsed = JSON.parse(raw) as { error?: string; message?: string };
        message = parsed.error || parsed.message || message;
      } catch {
        if (raw) {
          message = `${message}: ${raw}`;
        }
      }

      throw new Error(message);
    }

    const data = await response.json();
    console.log("🌐 [API] Create response received:", {
      competitors: data.data?.competitors,
      platforms: data.data?.platforms,
    });
    return data.data;
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to reach backend API. Make sure backend server is running.",
      );
    }
    throw error;
  }
}

/**
 * Get current user's creator profile
 */
export async function getMyProfile(
  token: string,
): Promise<CreatorProfile | null> {
  const response = await fetch(`${API_BASE}/creator-profiles/me/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null; // Profile doesn't exist
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch profile");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update creator profile
 */
export async function updateCreatorProfile(
  token: string,
  creatorId: string,
  profileData: Partial<CreatorProfileData>,
): Promise<CreatorProfile> {
  console.log("🌐 [API] Updating profile - sending to backend:", {
    creatorId,
    competitors: profileData.competitors,
    platforms: profileData.platforms,
    niche: profileData.niche,
    fullData: JSON.stringify(profileData),
  });

  const response = await fetch(`${API_BASE}/creator-profiles/${creatorId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update profile");
  }

  const data = await response.json();
  console.log("🌐 [API] Update response received:", {
    competitors: data.data?.competitors,
    platforms: data.data?.platforms,
  });
  return data.data;
}

/**
 * Complete onboarding (mark as completed)
 */
export async function completeOnboarding(
  token: string,
  creatorId: string,
): Promise<CreatorProfile> {
  const response = await fetch(
    `${API_BASE}/creator-profiles/${creatorId}/complete-onboarding`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to complete onboarding");
  }

  const data = await response.json();
  return data.data;
}

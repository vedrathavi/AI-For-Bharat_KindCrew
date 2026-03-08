"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

export default function ProfilePage() {
  const router = useRouter();
  const { userInfo, token, authReady, isAuthenticated, logout } = useAuth();
  const { creatorProfile, fetchProfile, profileLoading, hasProfile } =
    useAppStore();
  console.log("User Info:", userInfo);
  console.log("Creator Profile:", creatorProfile);
  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    if (token && isAuthenticated() && authReady) {
      fetchProfile(token);
    }
  }, [token, isAuthenticated, authReady, fetchProfile]);

  if (!authReady) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div style={{ color: "var(--color-text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const profileContent = (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold"
          style={{ color: "var(--color-text)" }}
        >
          Profile
        </h1>
      </div>

      {/* User Information */}
      <div
        className="p-6 rounded-xl mb-6"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2
          className="text-2xl font-semibold mb-6"
          style={{ color: "var(--color-text)" }}
        >
          User Information
        </h2>
        <div className="flex items-start gap-6 flex-col sm:flex-row">
          {userInfo?.profileImage ? (
            <img
              src={userInfo.profileImage}
              alt={userInfo.name}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            >
              <span style={{ color: "var(--color-text)" }}>
                {(userInfo?.givenName || userInfo?.name)?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <div className="flex-1 space-y-3">
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Name
              </p>
              <p className="text-lg" style={{ color: "var(--color-text)" }}>
                {userInfo?.givenName && userInfo?.familyName
                  ? `${userInfo.givenName} ${userInfo.familyName}`
                  : userInfo?.name || "N/A"}
              </p>
            </div>
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Email
              </p>
              <p className="text-lg" style={{ color: "var(--color-text)" }}>
                {userInfo?.email || "N/A"}
              </p>
            </div>
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                User ID
              </p>
              <p
                className="text-sm font-mono"
                style={{ color: "var(--color-text-muted)" }}
              >
                {userInfo?.userId || "N/A"}
              </p>
            </div>
            <div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Role
              </p>
              <span
                className="px-3 py-1 rounded-full text-sm inline-block"
                style={{
                  backgroundColor: "var(--color-surface-hover)",
                  color: "var(--color-text)",
                }}
              >
                {userInfo?.role || "user"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Profile */}
      {hasProfile && creatorProfile ? (
        <div
          className="p-6 rounded-xl"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Creator Profile
            </h2>
            <button
              onClick={() => router.push("/onboarding?edit=true")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--color-surface-hover)",
                color: "var(--color-text)",
              }}
            >
              Edit Profile
            </button>
          </div>

          <div className="space-y-6">
            {/* Niche */}
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--color-text)" }}
              >
                Niche
              </h3>
              <div className="flex flex-wrap gap-2">
                <span
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{
                    background:
                      "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
                    color: "var(--color-white)",
                  }}
                >
                  {creatorProfile.niche.primary}
                </span>
                {creatorProfile.niche.secondary && (
                  <span
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      color: "var(--color-text)",
                    }}
                  >
                    {creatorProfile.niche.secondary}
                  </span>
                )}
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--color-text)" }}
              >
                Target Audience
              </h3>
              <p
                className="font-medium capitalize"
                style={{ color: "var(--color-text)" }}
              >
                {creatorProfile.targetAudience?.replace(/-/g, " ") || "N/A"}
              </p>
            </div>

            {/* Platforms */}
            {creatorProfile.platforms &&
              creatorProfile.platforms.length > 0 && (
                <div>
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: "var(--color-text)" }}
                  >
                    Platforms
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {creatorProfile.platforms.map((platform, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg"
                        style={{
                          backgroundColor: "var(--color-background)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <p
                          className="font-medium mb-1"
                          style={{ color: "var(--color-text)" }}
                        >
                          {platform.name}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {platform.handle}
                        </p>
                        <span
                          className={`text-xs mt-2 inline-block ${
                            platform.active ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {platform.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Competitors */}
            {creatorProfile.competitors &&
              creatorProfile.competitors.length > 0 && (
                <div>
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: "var(--color-text)" }}
                  >
                    Competitors
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {creatorProfile.competitors.map((competitor, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg"
                        style={{
                          backgroundColor: "var(--color-background)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {competitor.name && (
                          <p
                            className="font-medium mb-1"
                            style={{ color: "var(--color-text)" }}
                          >
                            {competitor.name}
                          </p>
                        )}
                        {competitor.url && (
                          <p
                            className="text-sm mb-2 break-all"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {competitor.url}
                          </p>
                        )}
                        {competitor.notes && (
                          <p
                            className="text-sm italic"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {competitor.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Goals */}
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--color-text)" }}
              >
                Goals
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Primary Goal
                  </p>
                  <p
                    className="font-medium capitalize"
                    style={{ color: "var(--color-text)" }}
                  >
                    {creatorProfile.goals.primaryGoal.replace("-", " ")}
                  </p>
                </div>
                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Creator Level
                  </p>
                  <p
                    className="font-medium capitalize"
                    style={{ color: "var(--color-text)" }}
                  >
                    {creatorProfile.goals.creatorLevel}
                  </p>
                </div>
              </div>
            </div>

            {/* Strategy */}
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--color-text)" }}
              >
                Content Strategy
              </h3>
              <div className="space-y-3">
                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Content Type
                  </p>
                  <p
                    className="font-medium capitalize"
                    style={{ color: "var(--color-text)" }}
                  >
                    {creatorProfile.strategy.contentStrategy}
                  </p>
                </div>
                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Posting Frequency
                  </p>
                  <p
                    className="font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    {creatorProfile.strategy.postingFrequency}
                  </p>
                </div>
                {creatorProfile.strategy.contentPillars.length > 0 && (
                  <div>
                    <p
                      className="text-sm mb-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Content Pillars
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {creatorProfile.strategy.contentPillars.map(
                        (pillar, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 rounded-lg text-sm"
                            style={{
                              backgroundColor: "var(--color-background)",
                              border: "1px solid var(--color-border)",
                              color: "var(--color-text)",
                            }}
                          >
                            {pillar}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences */}
            {creatorProfile.preferences && (
              <div>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: "var(--color-text)" }}
                >
                  Preferences
                </h3>
                <div className="space-y-3">
                  {creatorProfile.preferences.tones &&
                    creatorProfile.preferences.tones.length > 0 && (
                      <div>
                        <p
                          className="text-sm mb-2"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          Tones
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {creatorProfile.preferences.tones.map(
                            (tone, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-lg text-sm"
                                style={{
                                  backgroundColor: "var(--color-background)",
                                  border: "1px solid var(--color-border)",
                                  color: "var(--color-text)",
                                }}
                              >
                                {tone}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  {creatorProfile.preferences.formats &&
                    creatorProfile.preferences.formats.length > 0 && (
                      <div>
                        <p
                          className="text-sm mb-2"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          Formats
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {creatorProfile.preferences.formats.map(
                            (format, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-lg text-sm"
                                style={{
                                  backgroundColor: "var(--color-background)",
                                  border: "1px solid var(--color-border)",
                                  color: "var(--color-text)",
                                }}
                              >
                                {format}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p
                        className="text-sm mb-1"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        CTA Strength
                      </p>
                      <p
                        className="font-medium capitalize"
                        style={{ color: "var(--color-text)" }}
                      >
                        {creatorProfile.preferences.constraints?.ctaStrength ||
                          "medium"}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-sm mb-1"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Formality
                      </p>
                      <p
                        className="font-medium capitalize"
                        style={{ color: "var(--color-text)" }}
                      >
                        {creatorProfile.preferences.constraints?.formality ||
                          "semi-formal"}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-sm mb-1"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Time Commitment
                      </p>
                      <p
                        className="font-medium capitalize"
                        style={{ color: "var(--color-text)" }}
                      >
                        {creatorProfile.preferences.timeCommitment || "medium"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div
              className="pt-4 border-t"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Status
                  </p>
                  <span
                    className="px-3 py-1 rounded-full text-sm inline-block capitalize"
                    style={{
                      backgroundColor:
                        creatorProfile.status === "active"
                          ? "rgba(34, 197, 94, 0.2)"
                          : "var(--color-surface-hover)",
                      color:
                        creatorProfile.status === "active"
                          ? "#22c55e"
                          : "var(--color-text)",
                    }}
                  >
                    {creatorProfile.status}
                  </span>
                </div>
                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Onboarding
                  </p>
                  <span
                    className="px-3 py-1 rounded-full text-sm inline-block"
                    style={{
                      backgroundColor: creatorProfile.settings
                        .onboardingCompleted
                        ? "rgba(34, 197, 94, 0.2)"
                        : "rgba(251, 146, 60, 0.2)",
                      color: creatorProfile.settings.onboardingCompleted
                        ? "#22c55e"
                        : "#fb923c",
                    }}
                  >
                    {creatorProfile.settings.onboardingCompleted
                      ? "Completed"
                      : "Incomplete"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="p-8 rounded-xl text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p
            className="text-lg mb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            No creator profile found
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{
              background: "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
              color: "var(--color-white)",
            }}
          >
            Create Profile
          </button>
        </div>
      )}
    </div>
  );

  return <AuthenticatedLayout>{profileContent}</AuthenticatedLayout>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import {
  FiTarget,
  FiEdit3,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiClock,
  FiTag,
} from "react-icons/fi";

export default function ProfilePage() {
  const router = useRouter();
  const { userInfo, token, authReady, isAuthenticated, logout } = useAuth();
  const { creatorProfile, fetchProfile, profileLoading, hasProfile } =
    useAppStore();

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

  const formatDateTime = (value?: string) => {
    if (!value) return "N/A";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "N/A";
    return dt.toLocaleString();
  };

  const profileContent = (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Profile</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your identity and creator setup in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/onboarding?edit=true")}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-white text-black text-sm font-medium transition-colors shadow-sm"
          >
            Edit Creator Profile
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-200 text-black text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-6 rounded-2xl border border-border bg-surface">
          <div className="flex items-start gap-5 flex-col sm:flex-row">
            {userInfo?.profileImage ? (
              <img
                src={userInfo.profileImage}
                alt={userInfo.name}
                className="w-24 h-24 rounded-full ring-2 ring-gray-700"
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
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">
                {userInfo?.givenName && userInfo?.familyName
                  ? `${userInfo.givenName} ${userInfo.familyName}`
                  : userInfo?.name || "User"}
              </h2>
              <p className="text-gray-400 mt-1">
                {userInfo?.email || "No email"}
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-gray-400">User ID</p>
                  <p className="text-sm font-mono text-gray-200 truncate mt-1">
                    {userInfo?.userId || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-gray-400">Role</p>
                  <p className="text-sm capitalize text-gray-200 mt-1">
                    {userInfo?.role || "user"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasProfile && creatorProfile ? (
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-gray-400 mb-1">Primary Niche</p>
              <p className="text-lg font-semibold text-gray-100">
                {creatorProfile.niche?.primary || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-gray-400 mb-1">Target Audience</p>
              <p className="text-lg font-semibold text-gray-100 capitalize">
                {creatorProfile.targetAudience?.replace(/-/g, " ") || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-gray-400 mb-1">Secondary Niche</p>
              <p className="text-base font-medium text-gray-100">
                {creatorProfile.niche?.secondary || "Not specified"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-gray-400 mb-1">
                Content Strategy Type
              </p>
              <p className="text-base font-medium text-gray-100 capitalize">
                {creatorProfile.strategy?.contentStrategy || "N/A"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Platforms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(creatorProfile.platforms || []).map((platform, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-border bg-background"
                >
                  <p className="font-medium text-gray-100">{platform.name}</p>
                  <p className="text-sm text-gray-400">{platform.handle}</p>
                  <span
                    className={`text-xs mt-2 inline-block ${
                      platform.active ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {platform.active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
              {(!creatorProfile.platforms ||
                creatorProfile.platforms.length === 0) && (
                <p className="text-sm text-gray-400">No platforms added yet.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Content Strategy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-border bg-background">
                <p className="text-xs text-gray-400">Primary Goal</p>
                <p className="text-sm text-gray-100 capitalize mt-1">
                  {creatorProfile.goals?.primaryGoal?.replace("-", " ") ||
                    "N/A"}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background">
                <p className="text-xs text-gray-400">Creator Level</p>
                <p className="text-sm text-gray-100 capitalize mt-1">
                  {creatorProfile.goals?.creatorLevel || "N/A"}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background">
                <p className="text-xs text-gray-400">Posting Frequency</p>
                <p className="text-sm text-gray-100 mt-1">
                  {creatorProfile.strategy?.postingFrequency || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {creatorProfile.preferences && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Preferences</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-gray-400 mb-2">Tones</p>
                  <div className="flex flex-wrap gap-2">
                    {(creatorProfile.preferences.tones || []).length > 0 ? (
                      (creatorProfile.preferences.tones || []).map(
                        (tone, index) => (
                          <span
                            key={`${tone}-${index}`}
                            className="px-3 py-1 rounded-lg text-sm border border-border bg-surface text-gray-200"
                          >
                            {tone}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="text-sm text-gray-400">
                        No tones selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-gray-400 mb-2">Formats</p>
                  <div className="flex flex-wrap gap-2">
                    {(creatorProfile.preferences.formats || []).length > 0 ? (
                      (creatorProfile.preferences.formats || []).map(
                        (format, index) => (
                          <span
                            key={`${format}-${index}`}
                            className="px-3 py-1 rounded-lg text-sm border border-border bg-surface text-gray-200"
                          >
                            {format}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="text-sm text-gray-400">
                        No formats selected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-gray-400">CTA Strength</p>
                  <p className="text-sm text-gray-100 capitalize mt-1">
                    {creatorProfile.preferences.constraints?.ctaStrength ||
                      "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-gray-400">Formality</p>
                  <p className="text-sm text-gray-100 capitalize mt-1">
                    {creatorProfile.preferences.constraints?.formality || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-gray-400">Time Commitment</p>
                  <p className="text-sm text-gray-100 capitalize mt-1">
                    {creatorProfile.preferences.timeCommitment || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-gray-400">Emoji Usage</p>
                  <p className="text-sm text-gray-100 mt-1">
                    {creatorProfile.preferences.constraints?.emojiUsage
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(creatorProfile.competitors || []).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Competitors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(creatorProfile.competitors || []).map((competitor) => (
                  <div
                    key={competitor.competitorId}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <p className="text-sm font-semibold text-gray-100">
                      {competitor.name || "Unnamed competitor"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 break-all">
                      {competitor.url || "No URL"}
                    </p>
                    {competitor.notes && (
                      <p className="text-sm text-gray-300 mt-2">
                        {competitor.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {creatorProfile.strategy?.contentPillars?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Content Pillars</h3>
              <div className="flex flex-wrap gap-2">
                {creatorProfile.strategy.contentPillars.map((pillar, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-lg text-sm border border-border bg-background text-gray-200"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-700">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background text-gray-200 text-sm capitalize border border-border">
              <FiTarget size={14} /> {creatorProfile.status || "unknown"}
            </span>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
                creatorProfile.settings?.onboardingCompleted
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {creatorProfile.settings?.onboardingCompleted ? (
                <FiCheckCircle size={14} />
              ) : (
                <FiAlertCircle size={14} />
              )}
              {creatorProfile.settings?.onboardingCompleted
                ? "Onboarding Complete"
                : "Onboarding Incomplete"}
            </span>
            {profileLoading && (
              <span className="text-sm text-gray-400">
                Refreshing profile...
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-10 rounded-2xl text-center border border-border bg-surface">
          <div className="mx-auto w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center mb-4">
            <FiEdit3 className="text-gray-300" size={22} />
          </div>
          <p className="text-lg mb-2 text-gray-200">No creator profile found</p>
          <p className="text-sm text-gray-400 mb-6">
            Complete onboarding once to unlock ideation, planning, and insights
            tailored to your niche.
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-6 py-3 rounded-xl font-medium transition-colors bg-white hover:bg-gray-100 text-black shadow-sm"
          >
            Create Profile
          </button>
        </div>
      )}
    </div>
  );

  return <AuthenticatedLayout>{profileContent}</AuthenticatedLayout>;
}

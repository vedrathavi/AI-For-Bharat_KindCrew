"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";
import { extractUserFromToken } from "@/lib/jwtDecode";
import { getUserIdeas, IdeaBrief } from "@/lib/api/ideation";
import { getUserContent } from "@/lib/api/content";
import SetupBanner from "@/components/SetupBanner";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import {
  FiEdit3,
  FiBarChart2,
  FiUser,
  FiCompass,
  FiArrowRight,
} from "react-icons/fi";

export default function DashboardPage() {
  const router = useRouter();
  const {
    userInfo,
    authReady,
    initializeAuth,
    isAuthenticated,
    setAuth,
    token,
  } = useAuth();

  const {
    creatorProfile,
    hasProfile,
    profileChecked,
    fetchProfile,
    profileLoading,
  } = useAppStore();

  const [showSetupBanner, setShowSetupBanner] = useState(true);
  const [recentIdeas, setRecentIdeas] = useState<IdeaBrief[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  const getPlatformCount = (content: any) => {
    if (Array.isArray(content?.platforms) && content.platforms.length > 0) {
      return content.platforms.length;
    }
    if (
      Array.isArray(content?.distribution?.platformTargets) &&
      content.distribution.platformTargets.length > 0
    ) {
      return content.distribution.platformTargets.length;
    }
    if (content?.platformVariants && typeof content.platformVariants === "object") {
      return Object.keys(content.platformVariants).length;
    }
    return 0;
  };

  const formatScore = (score: number | string | undefined) => {
    if (typeof score === "number") return score.toFixed(1);
    if (typeof score === "string") {
      const parsed = Number.parseFloat(score);
      return Number.isNaN(parsed) ? "0.0" : parsed.toFixed(1);
    }
    return "0.0";
  };

  // Handle token from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");

    if (urlToken) {
      const user = extractUserFromToken(urlToken);

      if (user) {
        setAuth({ token: urlToken, user });
        router.replace("/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [router, setAuth]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Fetch creator profile when authenticated
  useEffect(() => {
    if (token && isAuthenticated() && !profileChecked) {
      fetchProfile(token);
    }
  }, [token, isAuthenticated, profileChecked, fetchProfile]);

  useEffect(() => {
    const loadRecentIdeas = async () => {
      if (!userInfo?.userId || !token) {
        return;
      }

      setIdeasLoading(true);
      try {
        const result = await getUserIdeas(token);
        if (result.success) {
          setRecentIdeas((result.ideas || []).slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load recent ideas:", error);
      } finally {
        setIdeasLoading(false);
      }
    };

    if (authReady && isAuthenticated()) {
      loadRecentIdeas();
    }
  }, [authReady, isAuthenticated, userInfo?.userId, token]);

  useEffect(() => {
    const loadRecentContent = async () => {
      if (!userInfo?.userId || !token) {
        return;
      }

      setContentLoading(true);
      try {
        const result = await getUserContent(token);
        if (result.success && result.content) {
          setRecentContent(result.content.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load recent content:", error);
      } finally {
        setContentLoading(false);
      }
    };

    if (authReady && isAuthenticated()) {
      loadRecentContent();
    }
  }, [authReady, isAuthenticated, userInfo?.userId, token]);

  // Redirect to root if not authenticated
  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  if (!authReady || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "var(--color-background)",
          color: "var(--color-text-secondary)",
        }}
      >
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  const shouldShowSetupBanner =
    profileChecked &&
    (!hasProfile || !creatorProfile?.settings?.onboardingCompleted) &&
    showSetupBanner;

  const dashboardContent = (
    <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
      {/* Setup Banner */}
      {shouldShowSetupBanner && (
        <SetupBanner onDismiss={() => setShowSetupBanner(false)} />
      )}

      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-2"
          style={{ color: "var(--color-text)" }}
        >
          Welcome back, {userInfo?.givenName?.split(" ")[0] || "User"}!
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {hasProfile
            ? "Ready to create something amazing today?"
            : "Complete your profile to get started with personalized content."}
        </p>
      </div>

      {/* Profile Summary Card (if profile exists) */}
      {hasProfile && creatorProfile && (
        <div
          className="p-4 sm:p-6 rounded-xl mb-5 sm:mb-6"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Your Creator Profile
            </h2>
            <button
              onClick={() => router.push("/profile")}
              className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: "var(--color-surface-hover)",
                color: "var(--color-text)",
              }}
            >
              View Details
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="min-w-0">
              <p
                className="text-sm mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Primary Niche
              </p>
              <p
                className="font-medium capitalize break-words"
                style={{ color: "var(--color-text)" }}
              >
                {creatorProfile.niche.primary}
              </p>
            </div>
            <div className="min-w-0">
              <p
                className="text-sm mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Creator Level
              </p>
              <p
                className="font-medium capitalize break-words"
                style={{ color: "var(--color-text)" }}
              >
                {creatorProfile.goals.creatorLevel}
              </p>
            </div>
            <div className="min-w-0">
              <p
                className="text-sm mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Primary Goal
              </p>
              <p
                className="font-medium capitalize break-words"
                style={{ color: "var(--color-text)" }}
              >
                {creatorProfile.goals.primaryGoal.replace("-", " ")}
              </p>
            </div>
            <div className="min-w-0">
              <p
                className="text-sm mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Posting Frequency
              </p>
              <p
                className="font-medium break-words"
                style={{ color: "var(--color-text)" }}
              >
                {creatorProfile.strategy.postingFrequency}
              </p>
            </div>
            <div className="min-w-0">
              <p
                className="text-sm mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Target Audience
              </p>
              <p
                className="font-medium capitalize break-words"
                style={{ color: "var(--color-text)" }}
              >
                {creatorProfile.targetAudience?.replace(/-/g, " ") || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <button
          onClick={() => router.push("/ideation")}
          className="p-4 sm:p-6 rounded-xl text-left transition-all sm:hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              color: "var(--color-text)",
            }}
          >
            <FiCompass className="w-5 h-5" />
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            Ideation
          </h3>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Generate, evaluate, and save your best content ideas
          </p>
        </button>

        <button
          onClick={() => router.push("/content")}
          className="p-4 sm:p-6 rounded-xl text-left transition-all sm:hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              color: "var(--color-text)",
            }}
          >
            <FiEdit3 className="w-5 h-5" />
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            Create Content
          </h3>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Generate AI-powered content for your audience
          </p>
        </button>

        <button
          onClick={() => router.push("/analytics")}
          className="p-4 sm:p-6 rounded-xl text-left transition-all sm:hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              color: "var(--color-text)",
            }}
          >
            <FiBarChart2 className="w-5 h-5" />
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            View Analytics
          </h3>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Track your content performance
          </p>
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="p-4 sm:p-6 rounded-xl text-left transition-all sm:hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              color: "var(--color-text)",
            }}
          >
            <FiUser className="w-5 h-5" />
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            Your Profile
          </h3>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {hasProfile
              ? "View and edit your profile"
              : "Complete your creator profile"}
          </p>
        </button>
      </div>

      <div
        className="mt-6 sm:mt-8 rounded-xl p-4 sm:p-6"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2
              className="text-lg sm:text-xl font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Recent Saved Ideas
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Pick up where you left off.
            </p>
          </div>
          <button
            onClick={() => router.push("/ideation/my-ideas")}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              color: "var(--color-text)",
            }}
          >
            View all ideas
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>

        {ideasLoading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>
            Loading ideas...
          </p>
        ) : recentIdeas.length === 0 ? (
          <div className="flex items-center justify-between gap-3">
            <p style={{ color: "var(--color-text-secondary)" }}>
              No saved ideas yet. Generate your first one from Ideation.
            </p>
            <button
              onClick={() => router.push("/ideation")}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "var(--color-text)",
                color: "var(--color-background)",
              }}
            >
              Start ideation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentIdeas.map((idea) => (
              <button
                key={idea.ideaId}
                onClick={() => router.push("/ideation/my-ideas")}
                className="text-left p-4 rounded-lg"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {idea.platform}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {formatScore(idea.scores?.overall)}/10
                  </span>
                </div>
                <p
                  className="text-sm font-medium line-clamp-2"
                  style={{ color: "var(--color-text)" }}
                >
                  {idea.topic}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="mt-6 sm:mt-8 rounded-xl p-4 sm:p-6"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2
              className="text-lg sm:text-xl font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Recently Added Content
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Your latest generated content.
            </p>
          </div>
          <button
            onClick={() => router.push("/content/library")}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              color: "var(--color-text)",
            }}
          >
            View all content
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>

        {contentLoading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>
            Loading content...
          </p>
        ) : recentContent.length === 0 ? (
          <div className="flex items-center justify-between gap-3">
            <p style={{ color: "var(--color-text-secondary)" }}>
              No content yet. Generate your first content from Content Studio.
            </p>
            <button
              onClick={() => router.push("/content")}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "var(--color-text)",
                color: "var(--color-background)",
              }}
            >
              Create content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentContent.map((content, index) => (
              <button
                key={`${content._id || content.contentId || content.ideaId || content.createdAt || "content"}-${index}`}
                onClick={() => router.push("/content/library")}
                className="text-left p-4 rounded-lg"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs px-2 py-1 rounded capitalize"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {content.contentType || "post"}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {getPlatformCount(content)} platforms
                  </span>
                </div>
                <p
                  className="text-sm font-medium line-clamp-2"
                  style={{ color: "var(--color-text)" }}
                >
                  {content.topic || content.title || "Untitled Content"}
                </p>
                {content.createdAt && (
                  <p
                    className="text-xs mt-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {new Date(content.createdAt).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return <AuthenticatedLayout>{dashboardContent}</AuthenticatedLayout>;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";
import { getUserIdeas, IdeaBrief } from "@/lib/api/ideation";
import { getUserContent } from "@/lib/api/content";
import SetupBanner from "@/components/SetupBanner";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import {
  FiEdit3,
  FiBarChart2,
  FiCalendar,
  FiCompass,
  FiArrowRight,
  FiPlus,
  FiZap,
  FiLayers,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";
import { getGreetingName } from "@/lib/userUtils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

export default function DashboardPage() {
  const router = useRouter();
  const { userInfo, authReady, isAuthenticated, token } = useAuth();

  const creatorProfile = useAppStore((state) => state.creatorProfile);
  const hasProfile = useAppStore((state) => state.hasProfile);
  const profileChecked = useAppStore((state) => state.profileChecked);
  const profileLoading = useAppStore((state) => state.profileLoading);
  const fetchProfile = useAppStore((state) => state.fetchProfile);

  const [showSetupBanner, setShowSetupBanner] = useState(true);
  const [recentIdeas, setRecentIdeas] = useState<IdeaBrief[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  const isUserAuthenticated = Boolean(isAuthenticated);

  useEffect(() => {
    if (authReady && !isUserAuthenticated) {
      router.replace("/");
    }
  }, [authReady, isUserAuthenticated, router]);

  useEffect(() => {
    if (token && isUserAuthenticated && authReady && !profileChecked && !profileLoading) {
      fetchProfile(token);
    }
  }, [token, isUserAuthenticated, authReady, profileChecked, profileLoading, fetchProfile]);

  useEffect(() => {
    const loadRecentIdeas = async () => {
      if (!token) return;
      setIdeasLoading(true);
      try {
        const result = await getUserIdeas(token);
        if (result.success && Array.isArray(result.ideas)) {
          setRecentIdeas(result.ideas.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load ideas:", err);
      } finally {
        setIdeasLoading(false);
      }
    };

    if (token && isUserAuthenticated) {
      loadRecentIdeas();
    }
  }, [token, isUserAuthenticated]);

  useEffect(() => {
    const loadRecentContent = async () => {
      if (!token) return;
      setContentLoading(true);
      try {
        const result = await getUserContent(token);
        if (result.success && Array.isArray(result.data)) {
          setRecentContent(result.data.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load content:", err);
      } finally {
        setContentLoading(false);
      }
    };

    if (token && isUserAuthenticated) {
      loadRecentContent();
    }
  }, [token, isUserAuthenticated]);

  const quickActions = [
    {
      title: "Explore Ideas",
      description: "Generate and score high-potential content concepts",
      icon: FiCompass,
      href: "/ideation",
      badge: "Stage 1",
    },
    {
      title: "Create Draft",
      description: "Generate tailored posts with AI tone and formatting",
      icon: FiEdit3,
      href: "/content/create",
      badge: "Stage 2",
    },
    {
      title: "Content Calendar",
      description: "Manage scheduling and calendar synchronization",
      icon: FiCalendar,
      href: "/dashboard/planning",
      badge: "Stage 3",
    },
    {
      title: "Analytics",
      description: "Review performance heuristics and audience reach",
      icon: FiBarChart2,
      href: "/analytics",
      badge: "Stage 4",
    },
  ];

  const dashboardContent = (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Setup Progress Banner */}
      {showSetupBanner && (
        <SetupBanner onDismiss={() => setShowSetupBanner(false)} />
      )}

      {/* Greeting & Workspace Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Workspace Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {getGreetingName(userInfo)}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Track your creative pipeline, explore high-impact ideas, and craft multi-platform drafts.
          </p>
        </div>

        {hasProfile && creatorProfile?.niche?.primary && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 self-start sm:self-center">
            <Badge variant="default" className="text-xs">
              {creatorProfile.niche.primary}
            </Badge>
            {creatorProfile.goals?.creatorLevel && (
              <Badge variant="outline" className="capitalize text-xs">
                {creatorProfile.goals.creatorLevel}
              </Badge>
            )}
            {Array.isArray(creatorProfile.platforms) && (
              <span className="text-[11px] text-zinc-500 font-medium px-1">
                {creatorProfile.platforms.length} Platforms Linked
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4-Stage Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 group-hover:scale-105 group-hover:border-zinc-700 transition-all shadow-sm">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 uppercase tracking-wider">
                    {action.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors pt-2 border-t border-zinc-800/50">
                <span>Open module</span>
                <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Two-Column Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ideas Section */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <FiZap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                Recent Ideas
              </h2>
            </div>
            <Link
              href="/ideation/my-ideas"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              View all
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {ideasLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recentIdeas.length > 0 ? (
            <div className="space-y-3">
              {recentIdeas.map((idea) => {
                const ideaTitle = idea.topic || (idea as any).title || "Content Concept";
                const score = typeof idea.scores?.overall === "number"
                  ? idea.scores.overall
                  : typeof (idea as any).score === "number"
                  ? (idea as any).score
                  : 0;
                return (
                  <div
                    key={idea.ideaId}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200 truncate">
                          {ideaTitle}
                        </span>
                        {idea.status && (
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded ${
                              idea.status === "selected"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                            }`}
                          >
                            {idea.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        {idea.angle || idea.hookIdea || (idea as any).description || "Structured concept ready for drafting"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {score > 0 && (
                        <div className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-right">
                          <span className="text-xs font-bold text-amber-400">
                            {score.toFixed(1)}
                          </span>
                          <span className="text-[9px] text-zinc-500 block">Score</span>
                        </div>
                      )}
                      <Link
                        href={`/content/create?ideaId=${idea.ideaId}`}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                      >
                        Draft
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={FiCompass}
              title="No ideas generated yet"
              description="Start with our Zero-Idea generator or refine a rough concept to build your library."
              actionHref="/ideation"
              actionLabel="Generate Ideas"
            />
          )}
        </div>

        {/* Recent Content Drafts Section */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <FiLayers className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                Recent Drafts
              </h2>
            </div>
            <Link
              href="/content/library"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              View library
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {contentLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recentContent.length > 0 ? (
            <div className="space-y-3">
              {recentContent.map((item) => (
                <div
                  key={item.contentId || item.id}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs font-semibold text-zinc-200 truncate block">
                      {item.title || "Untitled Draft"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400 capitalize">
                        {item.type || "Post"}
                      </span>
                      {item.status && (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/content/${item.contentId || item.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FiEdit3}
              title="No content drafts yet"
              description="Transform an idea into full, tailored platform drafts with the creation wizard."
              actionHref="/content/create"
              actionLabel="Create Post"
            />
          )}
        </div>
      </div>
    </div>
  );

  return <AuthenticatedLayout>{dashboardContent}</AuthenticatedLayout>;
}

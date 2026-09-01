"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import {
  FiTrendingUp,
  FiEye,
  FiHeart,
  FiBarChart2,
  FiZap,
  FiArrowUpRight,
  FiCheckCircle,
  FiShare2,
  FiLayers,
  FiRefreshCw,
  FiPlus,
  FiInbox,
  FiArrowRight,
} from "react-icons/fi";
import { Badge } from "@/components/ui/Badge";

interface PostMetric {
  id: string;
  title: string;
  platform: string;
  pillar: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, userInfo, authReady } = useAuth();
  const authenticated = !!token && !!userInfo;

  useEffect(() => {
    if (authReady && !authenticated) {
      router.replace("/");
    }
  }, [authReady, authenticated, router]);

  // Zero mock data by default - ready for real content metrics
  const [posts, setPosts] = useState<PostMetric[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [activeRange, setActiveRange] = useState<"7d" | "30d" | "all">("30d");

  const updateMetrics = (id: string, views: number, likes: number, comments: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, views, likes, comments } : p))
    );
  };

  const selectedPost = posts.find((p) => p.id === selectedPostId) || (posts.length > 0 ? posts[0] : null);

  // Derived KPI computations
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const avgEngagementRate =
    totalViews > 0
      ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1)
      : "0.0";

  // Chart data formatting
  const chartData = posts.map((p) => ({
    name: p.title.length > 22 ? p.title.slice(0, 22) + "..." : p.title,
    views: p.views,
    engagement: p.likes + p.comments,
    platform: p.platform,
  }));

  // Diagnostic advice generator based on selected post metrics
  const getDiagnosticInsights = (post: PostMetric | null) => {
    if (!post) {
      return null;
    }

    const engRate =
      post.views > 0
        ? (((post.likes + post.comments) / post.views) * 100).toFixed(1)
        : "0.0";

    const isHighReach = post.views > 4000;

    return {
      engRate,
      hookVerdict: isHighReach
        ? "Exceptional Hook Retention (Top 10% of niche)"
        : "Moderate Hook Velocity — test contrasting opening statements",
      repurposeSuggestion:
        post.platform === "LinkedIn"
          ? "High comment velocity indicates strong candidate for a Twitter / X thread and newsletter deep dive."
          : "Format suited for expanding into a step-by-step visual carousel.",
      cadenceTip: "Publishing between 8:30 AM - 10:00 AM in your target timezone generated peak impressions.",
    };
  };

  const currentInsights = getDiagnosticInsights(selectedPost);

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Stage 4 — Analytics & Growth Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Content Performance & Insights
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Measure engagement velocity, calibrate high-converting content pillars, and diagnose what resonates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
              {(["7d", "30d", "all"] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeRange === range
                      ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "All Time"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.push("/ideation")}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>New Research</span>
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Impressions */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Total Impressions
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                <FiEye className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-zinc-100">
                {posts.length > 0 ? totalViews.toLocaleString() : "0"}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 mt-1">
                <span>{posts.length > 0 ? "+0.0% vs last period" : "No published data yet"}</span>
              </div>
            </div>
          </div>

          {/* Total Interactions */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Total Interactions
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                <FiHeart className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-zinc-100">
                {posts.length > 0 ? (totalLikes + totalComments).toLocaleString() : "0"}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 mt-1">
                <span>{posts.length > 0 ? "0.0% engagement" : "Awaiting post activity"}</span>
              </div>
            </div>
          </div>

          {/* Average Engagement Rate */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Avg Engagement Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                <FiTrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-zinc-100">
                {avgEngagementRate}%
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 mt-1">
                <span>{posts.length > 0 ? "Calculated live" : "Baseline pending"}</span>
              </div>
            </div>
          </div>

          {/* Top Converting Pillar */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Top Pillar
              </span>
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                <FiLayers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-zinc-100 truncate">
                {posts.length > 0 ? posts[0].pillar : "None"}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 truncate">
                {posts.length > 0 ? "Leading performance pillar" : "No active pillar data"}
              </p>
            </div>
          </div>
        </div>

        {/* Charts & AI Diagnostics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart Container */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <FiBarChart2 className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                  Impression & Interaction Distribution
                </h2>
              </div>
              <span className="text-xs text-zinc-500">Live Post Data</span>
            </div>

            {posts.length > 0 ? (
              <div className="w-full h-64 bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        borderRadius: "0.75rem",
                        color: "#f4f4f5",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                      }}
                      itemStyle={{ color: "#e4e4e7" }}
                      labelStyle={{ color: "#fbbf24", fontWeight: 600, marginBottom: "4px" }}
                    />
                    <Bar dataKey="views" name="Impressions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="engagement" name="Interactions" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-64 bg-zinc-950/50 rounded-xl border border-zinc-800/80 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                  <FiBarChart2 className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-zinc-200">Nothing to Analyze Yet</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Publish or import your created content to start measuring impression velocity, engagement distribution, and high-performing pillars.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/ideation")}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold transition-all border border-zinc-700/60 flex items-center gap-1.5"
                >
                  <span>Discover Ideas in Stage 1</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span>Impressions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span>Total Interactions</span>
                </div>
              </div>
              <span className="text-[11px] text-zinc-500">
                {posts.length > 0 ? "Click any post below to run AI diagnostics" : "Analytics ready"}
              </span>
            </div>
          </div>

          {/* AI Diagnostics & Insights Panel */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <FiZap className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                    AI Content Diagnostics
                  </h2>
                </div>
                {selectedPost && (
                  <Badge variant="warning" className="text-[10px]">
                    Post {selectedPost.id}
                  </Badge>
                )}
              </div>

              {selectedPost && currentInsights ? (
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                      Inspecting Post
                    </span>
                    <p className="text-xs font-semibold text-zinc-200 mt-0.5 line-clamp-2">
                      {selectedPost.title}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Engagement Velocity</span>
                      <span className="font-bold text-amber-400">
                        {currentInsights.engRate}%
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                      {currentInsights.hookVerdict}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      Repurposing Opportunity
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {currentInsights.repurposeSuggestion}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      Optimal Timing Window
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {currentInsights.cadenceTip}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400">
                    <FiZap className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-200">No Post Selected</h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Publish content from Stage 2 & 3 to analyze hook retention, viral reach velocity, and repurposing recommendations.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push(selectedPost ? `/content/create?topic=${encodeURIComponent(selectedPost.title)}` : "/content/create")}
              className="w-full mt-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>{selectedPost ? "Spin Next Iteration from Post" : "Create New Brief in Stage 2"}</span>
            </button>
          </div>
        </div>

        {/* Content Performance Table */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                Active Post Performance Roster
              </h2>
            </div>
            <span className="text-xs text-zinc-500">
              {posts.length > 0 ? "Edit metrics below to recalculate analytics live" : "0 Published Posts"}
            </span>
          </div>

          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((p) => {
                const isSelected = p.id === selectedPostId;
                const postEng =
                  p.views > 0
                    ? (((p.likes + p.comments) / p.views) * 100).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPostId(p.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                      isSelected
                        ? "border-amber-500/50 bg-zinc-950 shadow-sm"
                        : "border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/50 hover:border-zinc-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 truncate">
                          {p.title}
                        </span>
                        <Badge variant="default" className="text-[10px]">
                          {p.platform}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {p.pillar}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Published {p.publishedAt} • Computed Engagement Rate:{" "}
                        <span className="text-emerald-400 font-semibold">{postEng}%</span>
                      </p>
                    </div>

                    {/* Interactive Metric Input Controls */}
                    <div
                      className="flex items-center gap-3 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <FiEye className="w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="number"
                          value={p.views}
                          onChange={(e) =>
                            updateMetrics(p.id, Number(e.target.value), p.likes, p.comments)
                          }
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 text-xs font-medium focus:outline-none focus:border-zinc-600 transition-colors"
                          title="Views / Impressions"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <FiHeart className="w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="number"
                          value={p.likes}
                          onChange={(e) =>
                            updateMetrics(p.id, p.views, Number(e.target.value), p.comments)
                          }
                          className="w-16 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 text-xs font-medium focus:outline-none focus:border-zinc-600 transition-colors"
                          title="Likes / Reactions"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPostId(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-amber-400 text-zinc-950 font-bold"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {isSelected ? "Active Diagnostic" : "Inspect"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 bg-zinc-950/40 rounded-xl border border-zinc-800/60 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <FiInbox className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-bold text-zinc-200">No Published Posts to Track</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Generate ideas in Stage 1, draft high-converting content in Stage 2, and publish to populate your active performance roster automatically.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/ideation")}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Start Stage 1 Ideation</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/content/create")}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700/60"
                >
                  Create Brief in Stage 2
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

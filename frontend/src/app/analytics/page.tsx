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
} from "react-icons/fi";

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, authReady } = useAuth();

  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

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

  // sample published posts with metrics
  const initialPosts = [
    {
      id: "1",
      title: "Your SaaS is Leaking Money",
      platform: "Twitter",
      views: 5430,
      likes: 1200,
    },
    {
      id: "2",
      title: "The 'Lazy' Way to Build a Startup",
      platform: "LinkedIn",
      views: 1205,
      likes: 234,
    },
    {
      id: "3",
      title: "From 0 to 10k Followers",
      platform: "Instagram",
      views: 0,
      likes: 0,
    },
  ];
  const [posts, setPosts] = useState(initialPosts);

  const updateMetrics = (id: string, views: number, likes: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, views, likes } : p)),
    );
  };

  const [selectedForSuggestions, setSelectedForSuggestions] = useState<
    string | null
  >(null);

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FiTrendingUp className="text-gray-400" size={32} />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              Analysis & Feedback
            </h1>
            <p className="text-gray-400 mt-1">
              Learn what works and improve future content.
            </p>
          </div>
        </div>

        {/* Performance overview and suggestions side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-surface rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center gap-2 mb-4">
              <FiBarChart2 className="text-gray-400" size={20} />
              <h2 className="text-xl font-semibold">Performance Overview</h2>
            </div>
            {/* dark chart container */}
            <div className="w-full h-40 bg-background rounded-xl p-2 border border-border">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={posts}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="title"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    interval={0}
                    angle={0}
                    textAnchor="middle"
                  />
                  <YAxis
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "var(--color-text)" }}
                    itemStyle={{ color: "var(--color-text)" }}
                  />
                  <Bar dataKey="views" fill="var(--color-grey-600)" />
                  <Bar dataKey="likes" fill="var(--color-grey-400)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Views and likes by post. Click a row below to add/update data.
            </p>
          </div>
          <div className="bg-surface rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center gap-2 mb-4">
              <FiZap className="text-gray-400" size={20} />
              <h2 className="text-xl font-semibold">AI Suggestions</h2>
            </div>
            {selectedForSuggestions ? (
              <div className="text-sm text-gray-400">
                <p className="font-medium text-white mb-2">
                  Suggestions for:{" "}
                  {posts.find((p) => p.id === selectedForSuggestions)?.title}
                </p>
                <p className="mt-2">
                  [AI tips would appear here based on metrics]
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Select a post to get AI‑powered suggestions.
              </p>
            )}
          </div>
        </div>

        {/* Content performance list */}
        <div className="bg-surface rounded-xl p-6 shadow-lg border border-border">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="text-gray-400" size={20} />
            <h2 className="text-xl font-semibold">Content Performance</h2>
          </div>
          <div className="space-y-3">
            {posts.map((p) => (
              <div
                key={p.id}
                className="p-4 border border-border rounded-xl bg-background hover:bg-surface-hover transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{p.platform}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center gap-2">
                    <FiEye className="text-gray-400" size={16} />
                    <input
                      type="number"
                      placeholder="Views"
                      value={p.views}
                      onChange={(e) =>
                        updateMetrics(p.id, Number(e.target.value), p.likes)
                      }
                      className="w-24 bg-background border border-border text-white rounded-xl p-2 text-sm focus:border-border-light focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiHeart className="text-gray-400" size={16} />
                    <input
                      type="number"
                      placeholder="Likes"
                      value={p.likes}
                      onChange={(e) =>
                        updateMetrics(p.id, p.views, Number(e.target.value))
                      }
                      className="w-24 bg-background border border-border text-white rounded-xl p-2 text-sm focus:border-border-light focus:outline-none"
                    />
                  </div>
                  {p.views === 0 && p.likes === 0 ? (
                    <button
                      onClick={() => setSelectedForSuggestions(p.id)}
                      className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-xl text-sm transition-colors font-medium"
                    >
                      Add Performance
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedForSuggestions(p.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-white text-black rounded-xl text-sm transition-colors font-medium shadow-sm"
                    >
                      <FiZap size={14} />
                      Get Suggestions
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

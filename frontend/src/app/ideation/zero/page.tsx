"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useIdeation } from "@/hooks/useIdeation";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { interpretScore } from "@/lib/scoring/scoreInterpreter";
import { PlatformBadge, FormatBadge, getPlatformIcon, getPlatformDisplayName } from "@/lib/platformConfig";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCompass,
  FiRefreshCw,
  FiAlertCircle,
  FiLayers,
} from "react-icons/fi";

export default function ZeroIdeaPage() {
  const router = useRouter();
  const { userInfo, token, authReady } = useAuth();
  const authenticated = !!token && !!userInfo;
  const [enableLiveWebSearch, setEnableLiveWebSearch] = useState(false);
  const {
    ideas,
    selectedIdea,
    loading,
    error,
    profile,
    setProfile,
    generateIdeas,
    selectIdea,
    clearIdeas,
  } = useIdeation();

  const { creatorProfile, fetchProfile, profileChecked, profileLoading } = useCreatorProfile();

  useEffect(() => {
    if (authReady && token && authenticated && !profileChecked && !profileLoading) {
      fetchProfile(token);
    }
  }, [authReady, token, authenticated, profileChecked, profileLoading, fetchProfile]);

  useEffect(() => {
    if (creatorProfile) {
      const firstPlatform = Array.isArray(creatorProfile.platforms) && creatorProfile.platforms.length > 0
        ? creatorProfile.platforms[0].name
        : "linkedin";

      setProfile({
        niche: creatorProfile.niche?.primary || "",
        audience: creatorProfile.targetAudience || "",
        platforms: [firstPlatform],
        goal: creatorProfile.goals?.primaryGoal || "growth",
      });
    }
  }, [creatorProfile, setProfile]);

  const renderValue = (val: any) => {
    if (val == null) return "";
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  const handleGenerate = async () => {
    if (!userInfo?.userId) return;
    await generateIdeas(userInfo.userId, { ...profile, enableLiveWebSearch });
  };

  const handleSelectIdea = (idea: (typeof ideas)[0]) => {
    const rawPlatform = renderValue(idea.platform) || profile.platforms[0] || "linkedin";
    const rawFormat = renderValue(idea.format) || "post";
    const rawTitle = renderValue(idea.title);
    const rawAngle = renderValue(idea.angle) || renderValue(idea.description);

    sessionStorage.setItem(
      "selectedIdea",
      JSON.stringify({
        topic: rawTitle,
        angle: rawAngle,
        platform: rawPlatform,
        contentType: rawFormat,
        targetAudience: profile.audience,
        scores: idea.scores,
      }),
    );

    router.push("/ideation/research");
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push("/ideation")}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to Ideation Hub
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Pathway 1 — Zero Concept Generation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Generate 10 Viral Ideas From Scratch
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Let Bedrock analyze your creator niche, audience persona, and viral patterns to curate 10 structured concepts.
          </p>
        </div>

        {/* Input Form */}
        {ideas.length === 0 && (
          <div className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Primary Niche or Industry
              </label>
              <input
                type="text"
                value={profile.niche}
                onChange={(e) =>
                  setProfile({ ...profile, niche: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="e.g., AI Engineering, SaaS Growth, High-Performance Mindset"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={profile.audience}
                  onChange={(e) =>
                    setProfile({ ...profile, audience: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="e.g., startup founders"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Distribution Platform
                </label>
                <select
                  title="Platform"
                  value={profile.platforms[0] || "linkedin"}
                  onChange={(e) =>
                    setProfile({ ...profile, platforms: [e.target.value] })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Primary Objective
                </label>
                <select
                  title="Goal"
                  value={profile.goal}
                  onChange={(e) =>
                    setProfile({ ...profile, goal: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                >
                  <option value="growth">Audience Growth</option>
                  <option value="engagement">High Engagement</option>
                  <option value="leads">Lead Generation</option>
                  <option value="education">Authority & Education</option>
                </select>
              </div>
            </div>

            {/* Live Web Research Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-200">Live Web Research</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">Optional</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Search current web conversations and sources for fresher opportunities.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLiveWebSearch}
                  onChange={(e) => setEnableLiveWebSearch(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !profile.niche.trim()}
              className="w-full py-3 px-6 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              <FiCompass className="w-4 h-4" />
              {loading ? "Synthesizing High-Impact Concepts..." : "Generate Concepts"}
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generated Ideas Grid */}
        {ideas.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">
                  {ideas.length} Generated Concepts
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pick the most compelling concept to advance into automated research and drafting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => clearIdeas()}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                Regenerate Concepts
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...ideas]
                .sort((a, b) => {
                  const scoreA = Number(a.scores?.opportunityScore ?? a.scores?.overall ?? 0);
                  const scoreB = Number(b.scores?.opportunityScore ?? b.scores?.overall ?? 0);
                  return scoreB - scoreA;
                })
                .map((idea, index) => {
                const isSelected = selectedIdea === idea;
                const platformVal = renderValue(idea.platform);
                const formatVal = renderValue(idea.format);
                const angleVal = renderValue(idea.angle);
                const descVal = renderValue(idea.description);
                const titleVal = renderValue(idea.title);
                const oppScore = Number(idea.scores?.opportunityScore || idea.scores?.overall || 0);
                const scoreInterpretation = interpretScore(oppScore);

                return (
                  <div
                    key={index}
                    onClick={() => selectIdea(idea)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? "border-amber-500/60 bg-zinc-950 shadow-md ring-1 ring-amber-500/20"
                        : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PlatformBadge platform={platformVal} />
                          {formatVal && <FormatBadge format={formatVal} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${scoreInterpretation.badgeColor}`}>
                            {scoreInterpretation.label}
                          </span>
                          <span className="text-base font-bold text-zinc-100">
                            {oppScore > 0 ? oppScore.toFixed(1) : "—"}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
                        {titleVal}
                      </h3>

                      {descVal && (
                        <div className="text-xs text-zinc-300">
                          <MarkdownRenderer content={descVal} />
                        </div>
                      )}

                      {angleVal && (
                        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300">
                          <span className="font-semibold text-zinc-200">Angle: </span>
                          <MarkdownRenderer content={angleVal} className="inline" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-3 border-t border-zinc-800/60">
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectIdea(idea);
                          }}
                          className="w-full py-2 px-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.01] shadow-sm"
                        >
                          <span>Select Concept & Proceed to Research</span>
                          <FiArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

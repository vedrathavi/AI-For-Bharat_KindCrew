"use client";

import { useEffect, useState } from "react";
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
  FiEdit3,
  FiTarget,
  FiZap,
  FiLayers,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

export default function SomeIdeaPage() {
  const router = useRouter();
  const { userInfo, token, authReady } = useAuth();
  const authenticated = !!token && !!userInfo;
  const { creatorProfile, fetchProfile, profileChecked, profileLoading } = useCreatorProfile();
  const {
    ideas,
    selectedIdea,
    loading,
    error,
    refineIdea: refineIdeaAction,
    selectIdea,
    clearIdeas,
  } = useIdeation();

  const [enableLiveWebSearch, setEnableLiveWebSearch] = useState(false);
  const [formData, setFormData] = useState({
    roughIdea: "",
    audience: "",
    platform: "linkedin",
  });

  useEffect(() => {
    if (authReady && token && authenticated && !profileChecked && !profileLoading) {
      fetchProfile(token);
    }
  }, [authReady, token, authenticated, profileChecked, profileLoading, fetchProfile]);

  useEffect(() => {
    if (creatorProfile?.targetAudience) {
      setFormData((prev) => ({
        ...prev,
        audience: prev.audience || creatorProfile.targetAudience,
      }));
    }
  }, [creatorProfile]);

  const handleRefine = async () => {
    if (!userInfo?.userId || !formData.roughIdea.trim()) return;
    await refineIdeaAction(userInfo.userId, "", { ...formData, enableLiveWebSearch });
  };

  const handleSelectIdea = (idea: (typeof ideas)[0]) => {
    sessionStorage.setItem(
      "selectedIdea",
      JSON.stringify({
        topic: (idea.title || formData.roughIdea).trim(),
        angle: (idea.angle || "Unique perspective for this audience").trim(),
        platform: (idea.platform || formData.platform).trim(),
        contentType: (idea.format || idea.contentType || "post").trim(),
        targetAudience: formData.audience,
        hookIdea: idea.hook || idea.hookIdea || "",
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
              Pathway 2 — Angle Refinement
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Refine Your Rough Idea
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Transform a raw concept into 6 high-converting strategic angles tailored for your audience.
          </p>
        </div>

        {/* Input Form */}
        {ideas.length === 0 && (
          <div className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Your Rough Idea or Thesis
              </label>
              <textarea
                value={formData.roughIdea}
                onChange={(e) =>
                  setFormData({ ...formData, roughIdea: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600 resize-y min-h-[110px]"
                rows={4}
                placeholder="e.g., AI productivity tools, early-stage fundraising heuristics, or social distribution frameworks..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.audience}
                  onChange={(e) =>
                    setFormData({ ...formData, audience: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="e.g., startup founders, product engineers"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Primary Platform
                </label>
                <select
                  title="Platform"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
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
              onClick={handleRefine}
              disabled={loading || !formData.roughIdea.trim()}
              className="w-full py-3 px-6 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              <FiEdit3 className="w-4 h-4" />
              {loading ? "Generating 6 Strategic Angles..." : "Refine into 6 Angles"}
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

        {/* Refined Ideas Result List */}
        {ideas.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">
                  6 Refined Strategic Angles
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select your strongest angle to advance into automated research and drafting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => clearIdeas()}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                Try Different Idea
              </button>
            </div>

            <div className="space-y-4">
              {[...ideas]
                .sort((a, b) => {
                  const scoreA = Number(a.scores?.opportunityScore ?? a.scores?.overall ?? 0);
                  const scoreB = Number(b.scores?.opportunityScore ?? b.scores?.overall ?? 0);
                  return scoreB - scoreA;
                })
                .map((idea, index) => {
                const isSelected = selectedIdea === idea;
                const oppScore = Number(idea.scores?.opportunityScore || idea.scores?.overall || 0);
                const scoreInterpretation = interpretScore(oppScore);

                return (
                  <div
                    key={index}
                    onClick={() => selectIdea(idea)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                      isSelected
                        ? "border-amber-500/60 bg-zinc-950 shadow-md ring-1 ring-amber-500/20"
                        : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <PlatformBadge platform={idea.platform} />
                          {idea.format && <FormatBadge format={idea.format} />}
                        </div>
                        <h3 className="text-base font-bold text-zinc-100">
                          {idea.title}
                        </h3>
                        <div className="text-xs text-zinc-300">
                          <span className="font-semibold text-zinc-200">Angle: </span>
                          <MarkdownRenderer content={idea.angle || ""} className="inline" />
                        </div>
                        {idea.hook && (
                          <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 flex items-start gap-2.5">
                            <FiTarget className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-xs text-zinc-300 flex-1">
                              <span className="font-semibold text-zinc-200">Hook: </span>
                              <MarkdownRenderer content={idea.hook} className="inline" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Opportunity Score Badge */}
                      <div className="flex sm:flex-col items-center justify-between sm:justify-center p-3 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0 min-w-[110px] space-y-1 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${scoreInterpretation.badgeColor}`}>
                          {scoreInterpretation.label}
                        </span>
                        <span className="text-2xl font-bold text-zinc-100">
                          {oppScore > 0 ? oppScore.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Select / Advance Action Button */}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectIdea(idea);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] shadow-sm mt-2"
                      >
                        <span>Select Angle & Proceed to Research</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
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

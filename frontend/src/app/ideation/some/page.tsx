"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useIdeation } from "@/hooks/useIdeation";
import { FiArrowLeft, FiArrowRight, FiEdit3, FiTarget } from "react-icons/fi";

// Helper to safely format scores
const formatScore = (score: number | string | undefined): string => {
  if (typeof score === "number") return score.toFixed(1);
  if (typeof score === "string") return parseFloat(score).toFixed(1);
  return "0.0";
};

export default function SomeIdeaPage() {
  const router = useRouter();
  const { userInfo } = useAuth();
  const {
    ideas,
    selectedIdea,
    loading,
    error,
    refineIdea: refineIdeaAction,
    selectIdea,
    clearIdeas,
  } = useIdeation();

  const [formData, setFormData] = useState({
    roughIdea: "",
    audience: "startup founders",
    platform: "linkedin",
  });

  const handleRefine = async () => {
    if (!userInfo?.userId) {
      return;
    }

    if (!formData.roughIdea.trim()) {
      return;
    }

    const result = await refineIdeaAction(userInfo.userId, "", formData);
    if (!result) {
      return;
    }
  };

  const handleSelectIdea = (idea: typeof ideas[0]) => {
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
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <AuthenticatedLayout>
      <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
        <div className="mb-8">
          <button
            onClick={() => router.push("/ideation")}
            className="mb-4 flex items-center gap-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            Refine Your Rough Idea
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Turn your concept into 5 strategic content angles
          </p>
        </div>

        {/* Input Form */}
        {ideas.length === 0 && (
          <div
            className="rounded-xl p-8 mb-8"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Your Rough Idea
              </label>
              <textarea
                value={formData.roughIdea}
                onChange={(e) =>
                  setFormData({ ...formData, roughIdea: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text)",
                }}
                rows={4}
                placeholder="e.g., AI productivity tools, startup fundraising tips, social media algorithms..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.audience}
                  onChange={(e) =>
                    setFormData({ ...formData, audience: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                  }}
                  placeholder="e.g., startup founders"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Platform
                </label>
                <select
                  title="Platform"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRefine}
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--color-text)",
                color: "var(--color-background)",
              }}
            >
              <FiEdit3 className="w-4 h-4" />
              {loading ? "Refining Your Idea..." : "Refine into 5 Angles"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-6 py-4 rounded-lg mb-8"
            style={{ border: "1px solid #7f1d1d", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        {/* Refined Ideas */}
        {ideas.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                5 Refined Angles
              </h2>
              <button
                onClick={() => clearIdeas()}
                className="font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Try Different Idea
              </button>
            </div>

            <div className="space-y-4">
              {ideas.map((idea, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 transition-all cursor-pointer border ${
                    selectedIdea === idea
                      ? "border-purple-500"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor:
                      selectedIdea === idea
                        ? "var(--color-text)"
                        : "var(--color-border)",
                  }}
                  onClick={() => selectIdea(idea)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: "var(--color-surface-hover)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {idea.platform}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: "var(--color-surface-hover)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {idea.format}
                        </span>
                      </div>
                      <h3
                        className="text-xl font-semibold mb-2"
                        style={{ color: "var(--color-text)" }}
                      >
                        {idea.title}
                      </h3>
                      <p
                        className="text-sm mb-3"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <span className="font-medium">Angle:</span> {idea.angle}
                      </p>
                      {idea.hook && (
                        <p
                          className="text-sm p-3 rounded-lg flex items-center gap-2"
                          style={{
                            backgroundColor: "var(--color-surface-hover)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          <FiTarget className="w-4 h-4" />
                          <span className="font-medium">Hook:</span> {idea.hook}
                        </p>
                      )}
                    </div>
                    <div
                      className={`text-3xl font-bold ${getScoreColor(idea.scores.overall)} ml-4`}
                    >
                      {formatScore(idea.scores.overall)}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <div style={{ color: "var(--color-text-muted)" }}>
                        Overall
                      </div>
                      <div
                        className={`font-bold text-lg ${getScoreColor(idea.scores.overall)}`}
                      >
                        {formatScore(idea.scores.overall)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--color-text-muted)" }}>
                        Virality
                      </div>
                      <div
                        className={`font-semibold ${getScoreColor(idea.scores.virality)}`}
                      >
                        {formatScore(idea.scores.virality)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--color-text-muted)" }}>
                        Clarity
                      </div>
                      <div
                        className={`font-semibold ${getScoreColor(idea.scores.clarity)}`}
                      >
                        {formatScore(idea.scores.clarity)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--color-text-muted)" }}>
                        Competition
                      </div>
                      <div
                        className={`font-semibold ${getScoreColor(10 - idea.scores.competition)}`}
                      >
                        {formatScore(idea.scores.competition)}
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  {selectedIdea === idea && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectIdea(idea);
                      }}
                      className="w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: "var(--color-text)",
                        color: "var(--color-background)",
                      }}
                    >
                      Select This Angle
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

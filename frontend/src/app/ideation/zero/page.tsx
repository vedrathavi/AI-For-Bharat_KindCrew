"use client";

import { useRouter } from "next/navigation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useIdeation } from "@/hooks/useIdeation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCompass,
  FiRefreshCw,
} from "react-icons/fi";

// Helper to safely format scores
const formatScore = (score: number | string | undefined): string => {
  if (typeof score === "number") return score.toFixed(1);
  if (typeof score === "string") return parseFloat(score).toFixed(1);
  return "0.0";
};

export default function ZeroIdeaPage() {
  const router = useRouter();
  const { userInfo, token } = useAuth();
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
    if (!userInfo?.userId || !token) {
      return;
    }

    const result = await generateIdeas(token, profile);
    if (!result) {
      return;
    }
  };

  const handleSelectIdea = (ideaItem: typeof ideas[0]) => {
    selectIdea(ideaItem);
    // Store in session storage for next step
    sessionStorage.setItem(
      "selectedIdea",
      JSON.stringify({
        topic: ideaItem.title,
        angle: ideaItem.angle,
        platform: ideaItem.platform,
        contentType: ideaItem.format,
        targetAudience: profile.audience,
        hookIdea: ideaItem.hook || ideaItem.hookIdea || "",
        scores: ideaItem.scores,
      }),
    );

    // Move to research step
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
            Zero Idea Generator
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            AI will generate 10 high-quality content ideas for you
          </p>
        </div>

        {/* Profile Form */}
        {ideas.length === 0 && (
          <div
            className="rounded-xl p-8 mb-8"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h2
              className="text-xl font-semibold mb-6"
              style={{ color: "var(--color-text)" }}
            >
              Your Profile
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Niche
                </label>
                <input
                  type="text"
                  value={profile.niche}
                  onChange={(e) =>
                    setProfile({ ...profile, niche: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                  }}
                  placeholder="e.g., AI productivity"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Target Audience
                </label>
                <input
                  type="text"
                  value={profile.audience}
                  onChange={(e) =>
                    setProfile({ ...profile, audience: e.target.value })
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
                  value={profile.platforms[0]}
                  onChange={(e) =>
                    setProfile({ ...profile, platforms: [e.target.value] })
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

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Goal
                </label>
                <select
                  title="Goal"
                  value={profile.goal}
                  onChange={(e) =>
                    setProfile({ ...profile, goal: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="growth">Growth</option>
                  <option value="engagement">Engagement</option>
                  <option value="leads">Lead Generation</option>
                  <option value="education">Education</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-6 w-full py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--color-text)",
                color: "var(--color-background)",
              }}
            >
              <FiCompass className="w-4 h-4" />
              {loading ? "Generating Ideas..." : "Generate 10 Ideas"}
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

        {/* Ideas Grid */}
        {ideas.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {ideas.length} Ideas Generated
              </h2>
              <button
                onClick={() => clearIdeas()}
                className="font-medium flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <FiRefreshCw className="w-4 h-4" />
                Generate New Ideas
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {ideas.map((idea, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 cursor-pointer border transition-colors ${
                    selectedIdea === idea ? "" : ""
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
                  {/* Score Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        color: "var(--color-text-secondary)",
                        backgroundColor: "var(--color-surface-hover)",
                      }}
                    >
                      {renderValue(idea.platform)}
                    </span>
                    <span
                      className={`text-2xl font-bold ${getScoreColor(idea.scores.overall)}`}
                    >
                      {idea.scores.overall}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    {renderValue(idea.title)}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {renderValue(idea.description)}
                  </p>

                  {/* Format & Angle */}
                  <div className="flex gap-2 mb-4">
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: "var(--color-surface-hover)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {renderValue(idea.format)}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: "var(--color-surface-hover)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {renderValue(idea.angle)}
                    </span>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
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
                      className="mt-4 w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: "var(--color-text)",
                        color: "var(--color-background)",
                      }}
                    >
                      Select This Idea
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateIdea, IdeaEvaluation } from "@/lib/api/ideation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiTarget,
} from "react-icons/fi";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
}

// Helper to safely format scores
const formatScore = (score: number | string | undefined): string => {
  if (typeof score === "number") return score.toFixed(1);
  if (typeof score === "string") return parseFloat(score).toFixed(1);
  return "0.0";
};

export default function FullIdeaPage() {
  const router = useRouter();
  const { userInfo, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<IdeaEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    idea: "",
    audience: "startup founders",
    platform: "linkedin",
  });

  const handleEvaluate = async () => {
    if (!userInfo?.userId || !token) {
      setError("Your session is not ready. Please refresh and try again.");
      return;
    }

    if (!formData.idea.trim()) {
      setError("Please enter your content idea");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await evaluateIdea(token, formData);

      if (result.success && result.evaluation) {
        setEvaluation(result.evaluation);
      } else {
        setError(result.error || "Failed to evaluate idea");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!evaluation) return;

    sessionStorage.setItem(
      "selectedIdea",
      JSON.stringify({
        topic: evaluation.improvedTitle || formData.idea,
        angle: "full idea",
        platform: formData.platform,
        contentType: evaluation.format || "post",
        targetAudience: formData.audience,
        hookIdea: evaluation.suggestedHook || "",
        scores: evaluation.scores,
      }),
    );

    router.push("/ideation/research");
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    return "Needs Work";
  };

  return (
    <AuthenticatedLayout>
      <div className="w-full max-w-5xl mx-auto overflow-x-hidden">
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
            Evaluate Your Full Idea
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Get AI scoring and optimization suggestions
          </p>
        </div>

        {/* Input Form */}
        {!evaluation && (
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
                Your Content Idea
              </label>
              <textarea
                value={formData.idea}
                onChange={(e) =>
                  setFormData({ ...formData, idea: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text)",
                }}
                rows={4}
                placeholder="e.g., Top 5 AI tools founders can use to automate repetitive work and save 10 hours per week"
              />
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Be as specific as possible. Include your target outcome or
                benefit.
              </p>
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
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--color-text)",
                color: "var(--color-background)",
              }}
            >
              <FiTarget className="w-4 h-4" />
              {loading ? "Evaluating Your Idea..." : "Evaluate Idea"}
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

        {/* Evaluation Results */}
        {evaluation && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div
              className="rounded-xl p-8 text-center"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h2
                className="text-lg mb-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Overall Score
              </h2>
              <div
                className={`text-6xl font-bold mb-2 ${getScoreColor(evaluation.scores.overall).split(" ")[0]}`}
              >
                {formatScore(evaluation.scores.overall)}
              </div>
              <div
                className={`inline-block px-4 py-2 rounded-full font-semibold ${getScoreColor(evaluation.scores.overall)}`}
              >
                {getScoreLabel(evaluation.scores.overall)}
              </div>
            </div>

            {/* Score Breakdown */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h3
                className="text-xl font-semibold mb-6"
                style={{ color: "var(--color-text)" }}
              >
                Score Breakdown
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    label: "Virality",
                    score: evaluation.scores.virality,
                    desc: "Shareability potential",
                  },
                  {
                    label: "Clarity",
                    score: evaluation.scores.clarity,
                    desc: "Idea clarity & focus",
                  },
                  {
                    label: "Competition",
                    score: evaluation.scores.competition,
                    desc: "Market saturation",
                  },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div
                      className="text-sm mb-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`text-4xl font-bold mb-1 ${getScoreColor(item.score).split(" ")[0]}`}
                    >
                      {formatScore(item.score)}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {item.desc}
                    </div>
                    <div
                      className="mt-2 rounded-full h-2"
                      style={{ backgroundColor: "var(--color-border)" }}
                    >
                      <div
                        className={`h-2 rounded-full ${getScoreColor(item.score).split(" ")[0].replace("text", "bg")}`}
                        style={{ width: `${item.score * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Improved Version */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--color-text)" }}
              >
                Improved Version
              </h3>
              <div
                className="p-6 rounded-lg mb-4"
                style={{
                  backgroundColor: "var(--color-surface-hover)",
                  borderLeft: "4px solid var(--color-text)",
                }}
              >
                <h4
                  className="font-semibold mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  {evaluation.improvedTitle || formData.idea}
                </h4>
                {evaluation.suggestedHook && (
                  <p
                    className="text-sm flex items-center gap-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <FiTarget className="w-4 h-4" />
                    <span className="font-medium">Hook:</span>{" "}
                    {evaluation.suggestedHook}
                  </p>
                )}
              </div>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <span
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: "var(--color-surface-hover)" }}
                >
                  {evaluation.format || "post"}
                </span>
                <span
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: "var(--color-surface-hover)" }}
                >
                  {formData.platform}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setEvaluation(null)}
                className="flex-1 py-3 px-6 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: "var(--color-surface-hover)",
                  color: "var(--color-text)",
                }}
              >
                Try Different Idea
              </button>
              <button
                onClick={handleProceed}
                className="flex-1 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--color-text)",
                  color: "var(--color-background)",
                }}
              >
                <FiCheckCircle className="w-4 h-4" />
                Proceed to Research
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

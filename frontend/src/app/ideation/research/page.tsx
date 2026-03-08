"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  researchIdea,
  selectIdea,
  ResearchData,
  IdeaBrief,
} from "@/lib/api/ideation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiSearch,
  FiTarget,
  FiZap,
} from "react-icons/fi";

type SelectedIdea = Pick<
  IdeaBrief,
  | "topic"
  | "angle"
  | "platform"
  | "contentType"
  | "targetAudience"
  | "hookIdea"
  | "scores"
>;

function normalizeSelectedIdea(raw: unknown): SelectedIdea {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    topic: String(data.topic || data.title || "").trim(),
    angle: String(data.angle || "General strategic angle").trim(),
    platform: String(data.platform || "youtube").trim(),
    contentType: String(data.contentType || data.format || "post").trim(),
    targetAudience: String(
      data.targetAudience || data.audience || "General audience",
    ).trim(),
    hookIdea: String(data.hookIdea || data.hook || "").trim(),
    scores: {
      virality: Number(
        (data.scores as Record<string, unknown> | undefined)?.virality ?? 0,
      ),
      clarity: Number(
        (data.scores as Record<string, unknown> | undefined)?.clarity ?? 0,
      ),
      competition: Number(
        (data.scores as Record<string, unknown> | undefined)?.competition ?? 0,
      ),
      overall: Number(
        (data.scores as Record<string, unknown> | undefined)?.overall ?? 0,
      ),
    },
  };
}

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

function normalizeResearchResponse(raw: unknown): ResearchData {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const normalizeArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? "").trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/\n|\||,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const normalizeString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  };

  return {
    audiencePainPoints: normalizeArray(
      data.audiencePainPoints ?? data.audience_pain_points ?? data.painPoints,
    ),
    competitorPatterns: normalizeArray(
      data.competitorPatterns ?? data.competitor_patterns ?? data.competitors,
    ),
    keyPoints: normalizeArray(
      data.keyPoints ?? data.key_points ?? data.keyInsights ?? data.insights,
    ),
    recommendedStructure: normalizeString(
      data.recommendedStructure ?? data.recommended_structure ?? data.structure,
    ),
    yourAngleStrength: normalizeString(
      data.yourAngleStrength ?? data.your_angle_strength ?? data.angleStrength,
    ),
  };
}

export default function ResearchPage() {
  const router = useRouter();
  const { userInfo, token, authReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<SelectedIdea | null>(null);

  const getMissingFields = (idea: SelectedIdea) => {
    const missing: string[] = [];
    if (!idea.topic?.trim()) missing.push("topic");
    if (!idea.angle?.trim()) missing.push("angle");
    if (!idea.platform?.trim()) missing.push("platform");
    if (!idea.targetAudience?.trim()) missing.push("targetAudience");
    return missing;
  };

  useEffect(() => {
    const storedIdea = sessionStorage.getItem("selectedIdea");
    if (!storedIdea) {
      router.push("/ideation");
      return;
    }

    try {
      const parsed = JSON.parse(storedIdea);
      const normalized = normalizeSelectedIdea(parsed);
      setSelectedIdea(normalized);
      sessionStorage.setItem("selectedIdea", JSON.stringify(normalized));
    } catch {
      router.push("/ideation");
    }
  }, [router]);

  const handleResearch = async () => {
    if (!selectedIdea) return;

    if (!authReady || !userInfo?.userId || !token) {
      setError("Please wait for authentication to complete");
      return;
    }

    const missingFields = getMissingFields(selectedIdea);
    if (missingFields.length > 0) {
      setError(
        `Idea data is incomplete: ${missingFields.join(", ")}. Please reselect an idea from rough/full flow.`,
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await researchIdea(token, {
        idea: selectedIdea.topic,
        audience: selectedIdea.targetAudience,
      });

      if (result.success && result.research) {
        setResearch(normalizeResearchResponse(result.research));
      } else {
        setError(result.error || "Failed to research idea");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedIdea) return;

    if (!authReady || !userInfo?.userId || !token) {
      setError("Please wait for authentication to complete");
      return;
    }

    const missingFields = getMissingFields(selectedIdea);
    if (missingFields.length > 0) {
      setError(
        `Cannot save idea. Missing: ${missingFields.join(", ")}. Please go back and reselect.`,
      );
      return;
    }

    setLoading(true);

    try {
      const normalizedResearch = research
        ? normalizeResearchResponse(research)
        : null;

      const result = await selectIdea(token, {
        topic: selectedIdea.topic,
        angle: selectedIdea.angle,
        platform: selectedIdea.platform,
        contentType: selectedIdea.contentType,
        targetAudience: selectedIdea.targetAudience,
        hookIdea: selectedIdea.hookIdea,
        keyPoints: normalizedResearch?.keyPoints || [],
        research: normalizedResearch
          ? {
              audiencePainPoints: normalizedResearch.audiencePainPoints || [],
              competitorPatterns: normalizedResearch.competitorPatterns || [],
              recommendedStructure: normalizedResearch.recommendedStructure,
              keyPoints: normalizedResearch.keyPoints || [],
              yourAngleStrength: normalizedResearch.yourAngleStrength,
            }
          : undefined,
        scores: selectedIdea.scores,
      });

      if (result.success) {
        sessionStorage.removeItem("selectedIdea");
        router.push("/ideation/success?id=" + result.ideaId);
      } else {
        setError(result.error || "Failed to save idea");
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!selectedIdea) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div style={{ color: "var(--color-text-secondary)" }}>Loading...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <AuthenticatedLayout>
      <div className="w-full max-w-5xl mx-auto overflow-x-hidden">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
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
            Research and Validation
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Understand audience pain points and competitor patterns
          </p>
        </div>

        {/* Selected Idea Summary */}
        <div
          className="rounded-xl p-8 mb-8"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Selected Idea
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
              {selectedIdea.topic}
            </h4>
            {selectedIdea.hookIdea && (
              <div
                className="text-sm mb-3 flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <FiTarget className="w-4 h-4" />
                <span className="font-medium">Hook:</span>
                <div className="flex-1">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span>{children}</span>,
                    }}
                  >
                    {selectedIdea.hookIdea}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              <span
                className="px-3 py-1 rounded-full border"
                style={{ borderColor: "var(--color-border)" }}
              >
                {selectedIdea.platform}
              </span>
              <span
                className="px-3 py-1 rounded-full border"
                style={{ borderColor: "var(--color-border)" }}
              >
                {selectedIdea.contentType}
              </span>
              <span
                className="px-3 py-1 rounded-full border flex items-center gap-1"
                style={{ borderColor: "var(--color-border)" }}
              >
                <FiTarget className="w-3 h-3" />
                {selectedIdea.targetAudience}
              </span>
              {selectedIdea.scores && (
                <span
                  className={`px-3 py-1 rounded-full font-medium ${getScoreColor(selectedIdea.scores.overall)}`}
                >
                  Score: {formatScore(selectedIdea.scores.overall)}/10
                </span>
              )}
            </div>
          </div>

          {!research && (
            <button
              onClick={handleResearch}
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--color-text)",
                color: "var(--color-background)",
              }}
            >
              <FiSearch className="w-4 h-4" />
              {loading ? "Researching..." : "Start Research"}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="px-6 py-4 rounded-lg mb-8"
            style={{ border: "1px solid #7f1d1d", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        {/* Research Results */}
        {research && (
          <div className="space-y-6">
            {/* Audience Pain Points */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h3
                className="text-xl font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--color-text)" }}
              >
                <FiAlertCircle className="w-5 h-5" />
                Audience Pain Points
              </h3>
              <div className="space-y-3">
                {research.audiencePainPoints &&
                  research.audiencePainPoints.map(
                    (pain: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-4 rounded-lg border-l-4"
                        style={{
                          backgroundColor: "var(--color-surface-hover)",
                          borderLeftColor: "#ef4444",
                        }}
                      >
                        <span className="text-red-600 font-bold text-lg">
                          {idx + 1}
                        </span>
                        <div
                          className="flex-1 text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <ReactMarkdown>{pain}</ReactMarkdown>
                        </div>
                      </div>
                    ),
                  )}
              </div>
            </div>

            {/* Competitor Patterns */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h3
                className="text-xl font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--color-text)" }}
              >
                <FiTarget className="w-5 h-5" />
                What Is Already Working
              </h3>
              <div className="space-y-3">
                {research.competitorPatterns &&
                  research.competitorPatterns.map(
                    (pattern: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-4 rounded-lg border-l-4"
                        style={{
                          backgroundColor: "var(--color-surface-hover)",
                          borderLeftColor: "#22c55e",
                        }}
                      >
                        <FiCheck className="w-5 h-5 text-green-500" />
                        <div
                          className="flex-1 text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <ReactMarkdown>{pattern}</ReactMarkdown>
                        </div>
                      </div>
                    ),
                  )}
              </div>
            </div>

            {/* Your Angle */}
            {research.yourAngleStrength && (
              <div
                className="rounded-xl p-8"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h3
                  className="text-xl font-semibold mb-4 flex items-center gap-2"
                  style={{ color: "var(--color-text)" }}
                >
                  <FiZap className="w-5 h-5" />
                  Your Angle Strength
                </h3>
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: "var(--color-surface-hover)",
                    borderLeft: "4px solid var(--color-text)",
                  }}
                >
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    {research.yourAngleStrength}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setResearch(null)}
                className="flex-1 py-3 px-6 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: "var(--color-surface-hover)",
                  color: "var(--color-text)",
                }}
              >
                Research Again
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--color-text)",
                  color: "var(--color-background)",
                }}
              >
                <FiCheck className="w-4 h-4" />
                {loading ? "Saving..." : "Approve and Save Idea"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserIdeas, IdeaBrief } from "@/lib/api/ideation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";
import { FiArrowRight, FiCompass, FiEdit3, FiTarget } from "react-icons/fi";

export default function IdeationPage() {
  const router = useRouter();
  const { userInfo, token } = useAuth();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [recentIdeas, setRecentIdeas] = useState<IdeaBrief[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);

  const formatScore = (score: number | string | undefined) => {
    if (typeof score === "number") return score.toFixed(1);
    if (typeof score === "string") {
      const parsed = Number.parseFloat(score);
      return Number.isNaN(parsed) ? "0.0" : parsed.toFixed(1);
    }
    return "0.0";
  };

  const paths = [
    {
      id: "zero",
      title: "I have no idea what to create",
      description:
        "Get AI-generated content ideas based on your niche and audience",
      icon: FiCompass,
      path: "/ideation/zero",
    },
    {
      id: "some",
      title: "I have a rough idea",
      description: "Refine your concept into strategic content angles",
      icon: FiEdit3,
      path: "/ideation/some",
    },
    {
      id: "full",
      title: "I already know exactly what to create",
      description: "Evaluate and optimize your complete content idea",
      icon: FiTarget,
      path: "/ideation/full",
    },
  ];

  const handleSelect = (path: string) => {
    setSelectedPath(path);
    setTimeout(() => {
      router.push(path);
    }, 200);
  };

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
        console.error("Failed to load ideas:", error);
      } finally {
        setIdeasLoading(false);
      }
    };

    loadRecentIdeas();
  }, [userInfo?.userId, token]);

  return (
    <AuthenticatedLayout>
      <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Ideation and Research
              </h1>
              <p
                className="text-base sm:text-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Choose the path that matches how clear your content idea is.
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
              View all saved ideas
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {paths.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.path)}
              className={`p-6 rounded-xl text-left transition-all duration-200 border ${selectedPath === option.path ? "scale-[1.01]" : ""}`}
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor:
                  selectedPath === option.path
                    ? "var(--color-text)"
                    : "var(--color-border)",
              }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                style={{
                  backgroundColor: "var(--color-surface-hover)",
                  color: "var(--color-text)",
                }}
              >
                <option.icon className="w-5 h-5" />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: "var(--color-text)" }}
              >
                {option.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {option.description}
              </p>

              <div
                className="mt-6 flex items-center font-medium"
                style={{ color: "var(--color-text)" }}
              >
                Get Started
                <FiArrowRight className="w-4 h-4 ml-2" />
              </div>
            </button>
          ))}
        </div>

        <div
          className="mt-8 rounded-xl p-6"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Recent Saved Ideas
            </h3>
            <button
              onClick={() => router.push("/ideation/my-ideas")}
              className="text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              View all
            </button>
          </div>

          {ideasLoading ? (
            <p style={{ color: "var(--color-text-secondary)" }}>
              Loading ideas...
            </p>
          ) : recentIdeas.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)" }}>
              No approved ideas yet. Generate one and it will show up here.
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
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
          className="mt-8 rounded-xl p-6"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            What happens next?
          </h3>
          <div
            className="grid md:grid-cols-3 gap-6 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <div>
              <div
                className="font-medium mb-2"
                style={{ color: "var(--color-text)" }}
              >
                1. Generate Ideas
              </div>
              AI analyzes your profile and creates strategic content concepts
            </div>
            <div>
              <div
                className="font-medium mb-2"
                style={{ color: "var(--color-text)" }}
              >
                2. Score and Research
              </div>
              Each idea gets virality, clarity, and competition scores
            </div>
            <div>
              <div
                className="font-medium mb-2"
                style={{ color: "var(--color-text)" }}
              >
                3. Select and Proceed
              </div>
              Choose your favorite and move to content generation
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

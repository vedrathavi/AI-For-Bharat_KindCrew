"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useContent } from "@/hooks/useContent";
import { useAppStore } from "@/store/useAppStore";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEdit3,
  FiCheck,
  FiAlertCircle,
  FiSliders,
  FiZap,
  FiLayers,
} from "react-icons/fi";
import { Badge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { getPlatformIcon } from "@/lib/platformConfig";

const availablePlatforms = [
  { id: "linkedin", name: "LinkedIn" },
  { id: "twitter", name: "Twitter / X" },
  { id: "instagram", name: "Instagram" },
  { id: "youtube", name: "YouTube" },
  { id: "reddit", name: "Reddit" },
  { id: "medium", name: "Medium" },
];

const contentTypes = [
  { id: "list-post", name: "List Post / Breakdown" },
  { id: "story", name: "Story / Lesson" },
  { id: "educational", name: "Educational Guide" },
  { id: "tutorial", name: "Step-by-Step Tutorial" },
  { id: "opinion", name: "Contrarian / Opinion" },
  { id: "case-study", name: "Case Study / Teardown" },
];

const toneOptions = [
  "professional",
  "casual",
  "educational",
  "inspirational",
  "humorous",
  "analytical",
];

const goalOptions = [
  { id: "growth", name: "Audience Growth (Reach & Impressions)" },
  { id: "engagement", name: "Engagement (Comments & Discussions)" },
  { id: "authority", name: "Authority (Thought Leadership)" },
  { id: "conversion", name: "Conversion (Clicks & Signups)" },
];

function CreateContentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userInfo, token, authReady } = useAuth();
  const authenticated = !!token && !!userInfo;
  const creatorProfile = useAppStore((state) => state.creatorProfile);
  const { createFromManual: createContentAction, loading, error: storeError } = useContent();
  const [localError, setLocalError] = useState("");

  const [formData, setFormData] = useState({
    topic: "",
    platforms: ["linkedin"] as string[],
    contentType: "list-post",
    targetAudience: "",
    goal: "growth",
    hookIdea: "",
    keyPoints: ["", "", ""],
    tone: "professional",
    length: "medium",
    includeCTA: true,
  });

  useEffect(() => {
    if (authReady && !authenticated) {
      router.replace("/");
    }
  }, [authReady, authenticated, router]);

  // Prepopulate from CreatorProfile or sessionStorage if arriving from Ideation
  useEffect(() => {
    // Check sessionStorage
    try {
      const storedIdeaStr = sessionStorage.getItem("selectedIdea");
      if (storedIdeaStr) {
        const stored = JSON.parse(storedIdeaStr);
        if (stored.topic) {
          setFormData((prev) => ({
            ...prev,
            topic: stored.topic || prev.topic,
            hookIdea: stored.hookIdea || prev.hookIdea,
            targetAudience: stored.targetAudience || prev.targetAudience,
            platforms: stored.platform ? [stored.platform.toLowerCase()] : prev.platforms,
          }));
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Apply creator profile defaults if empty
    if (creatorProfile) {
      setFormData((prev) => ({
        ...prev,
        targetAudience: prev.targetAudience || creatorProfile.targetAudience || "",
        goal: prev.goal || creatorProfile.goals?.primaryGoal || "growth",
        tone:
          prev.tone ||
          (Array.isArray(creatorProfile.preferences?.tones) && creatorProfile.preferences.tones[0]) ||
          "professional",
      }));
    }
  }, [creatorProfile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData((prev) => {
      const exists = prev.platforms.includes(platformId);
      const platforms = exists
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId];
      return { ...prev, platforms };
    });
  };

  const handleKeyPointChange = (index: number, value: string) => {
    setFormData((prev) => {
      const keyPoints = [...prev.keyPoints];
      keyPoints[index] = value;
      return { ...prev, keyPoints };
    });
  };

  const addKeyPoint = () => {
    setFormData((prev) => ({
      ...prev,
      keyPoints: [...prev.keyPoints, ""],
    }));
  };

  const removeKeyPoint = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!formData.topic.trim()) {
      setLocalError("Please enter a content topic or concept.");
      return;
    }

    if (formData.platforms.length === 0) {
      setLocalError("Please select at least one distribution platform.");
      return;
    }

    const validKeyPoints = formData.keyPoints.filter((p) => p.trim() !== "");
    if (validKeyPoints.length === 0) {
      setLocalError("Please enter at least one key point or takeaway.");
      return;
    }

    if (!userInfo?.userId) {
      setLocalError("Your session is not ready. Please refresh and try again.");
      return;
    }

    const result = await createContentAction(userInfo.userId, {
      topic: formData.topic,
      platforms: formData.platforms,
      contentType: formData.contentType,
      targetAudience: formData.targetAudience || "general audience",
      goal: formData.goal,
      hookIdea: formData.hookIdea || null,
      keyPoints: validKeyPoints,
      preferences: {
        tone: formData.tone,
        length: formData.length,
        includeCTA: formData.includeCTA,
      },
    });

    if (result) {
      // Clear used sessionStorage
      try {
        sessionStorage.removeItem("selectedIdea");
      } catch {}
      router.push("/content/library");
    }
  };

  const errorMessage = localError || storeError;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="space-y-2">
        <Link
          href="/ideation"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          Back to Ideation
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Stage 2 — Content Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Create Content Draft
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Transform your topic or idea into optimized, multi-platform drafts tailored to your audience.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in">
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Creation Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-8 backdrop-blur-sm"
      >
        {/* Topic Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="topic" className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              Content Topic / Core Idea <span className="text-rose-400">*</span>
            </label>
            <InfoTooltip content="The central thesis, question, or lesson you want to share with your audience." />
          </div>
          <input
            type="text"
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            placeholder="e.g. 5 AI automation workflows that save founders 15 hours a week"
            className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            required
          />
        </div>

        {/* Target Platforms */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              Target Distribution Platforms <span className="text-rose-400">*</span>
            </label>
            <InfoTooltip content="Select all channels you want Bedrock to generate tailored formatting variants for." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {availablePlatforms.map((p) => {
              const isSelected = formData.platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePlatformToggle(p.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-zinc-900 border-amber-500/60 text-zinc-100 shadow-sm"
                      : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {getPlatformIcon(p.id)}
                    <span>{p.name}</span>
                  </span>
                  {isSelected ? (
                    <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px]">
                      <FiCheck className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-zinc-800" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Type & Goal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Content Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="contentType" className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                Content Structure / Type <span className="text-rose-400">*</span>
              </label>
              <InfoTooltip content="The storytelling format and structure of the output post." />
            </div>
            <select
              id="contentType"
              name="contentType"
              value={formData.contentType}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm focus:outline-none focus:border-zinc-600 transition-colors"
            >
              {contentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="goal" className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                Primary Content Objective
              </label>
              <InfoTooltip content="Helps optimize hooks and engagement triggers for reach vs conversions." />
            </div>
            <select
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm focus:outline-none focus:border-zinc-600 transition-colors"
            >
              {goalOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="targetAudience" className="text-xs font-semibold text-zinc-200">
                Target Audience
              </label>
              <InfoTooltip content="Specify the precise demographic or persona reading this post." />
            </div>
            <input
              type="text"
              id="targetAudience"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              placeholder="e.g. Early-stage Founders, Engineers, Growth Leads"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tone" className="text-xs font-semibold text-zinc-200">
                Draft Tone & Voice
              </label>
              <InfoTooltip content="Voice personality applied to phrasing, hooks, and punctuation." />
            </div>
            <select
              id="tone"
              name="tone"
              value={formData.tone}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm capitalize focus:outline-none focus:border-zinc-600 transition-colors"
            >
              {toneOptions.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hook Idea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="hookIdea" className="text-xs font-semibold text-zinc-200">
              Custom Hook / Opening Line (Optional)
            </label>
            <InfoTooltip content="Provide a raw opening hook if you already have one in mind; otherwise AI will generate strong variations." />
          </div>
          <textarea
            id="hookIdea"
            name="hookIdea"
            value={formData.hookIdea}
            onChange={handleInputChange}
            placeholder="e.g. Most builders spend 40 hours building features nobody asked for. Here is how we validated our MVP in 48 hours..."
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
          />
        </div>

        {/* Key Points */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              Key Points & Takeaways <span className="text-rose-400">*</span>
            </label>
            <InfoTooltip content="The specific steps, lessons, or framework elements that form the body of the post." />
          </div>
          <div className="space-y-2.5">
            {formData.keyPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500 w-5 text-center shrink-0">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={point}
                  onChange={(e) => handleKeyPointChange(index, e.target.value)}
                  placeholder={`Key point ${index + 1} (e.g. Automate customer intake with LLMs)`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                {formData.keyPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKeyPoint(index)}
                    className="p-2.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    aria-label="Remove key point"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addKeyPoint}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors pt-1"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Add another key point
          </button>
        </div>

        {/* Post Options (Length & CTA) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
          <div className="space-y-2">
            <label htmlFor="length" className="text-xs font-semibold text-zinc-200">
              Content Length
            </label>
            <select
              id="length"
              name="length"
              value={formData.length}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs sm:text-sm focus:outline-none focus:border-zinc-600 transition-colors"
            >
              <option value="short">Short (Bite-sized punchy post)</option>
              <option value="medium">Medium (Standard structured post)</option>
              <option value="long">Long (Deep-dive breakdown or thread)</option>
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-950 w-full cursor-pointer hover:border-zinc-700 transition-colors">
              <input
                type="checkbox"
                id="includeCTA"
                name="includeCTA"
                checked={formData.includeCTA}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-zinc-200">
                Include High-Converting Call-to-Action
              </span>
            </label>
          </div>
        </div>

        {/* Submit Footer */}
        <div className="pt-6 border-t border-zinc-800/80 flex items-center justify-between">
          <p className="text-xs text-zinc-500 hidden sm:block">
            Generates tailored formatting variants for all selected platforms.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <FiZap className="w-4 h-4 text-amber-500" />
            {loading ? "Generating Drafts with AI..." : "Generate Multi-Platform Drafts"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ManualContentCreation() {
  return (
    <AuthenticatedLayout>
      <Suspense
        fallback={
          <div className="p-12 text-center text-zinc-500 text-xs">
            Loading Content Creator...
          </div>
        }
      >
        <CreateContentForm />
      </Suspense>
    </AuthenticatedLayout>
  );
}

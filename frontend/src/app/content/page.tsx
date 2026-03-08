"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useContent } from "@/hooks/useContent";
import { getUserIdeas, IdeaBrief } from "@/lib/api/ideation";
import { createContentFromIdea, createContentFromManual } from "@/lib/api/content";
import { useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { FiCheckCircle, FiCopy, FiEdit3, FiLayers, FiZap } from "react-icons/fi";

type InputMode = "idea" | "manual";

type IdeaItem = {
  ideaId: string;
  userId?: string;
  topic?: string;
  title?: string;
  angle?: string;
  description?: string;
  scores?: { virality?: number };
};

type SavedContentItem = {
  contentId: string;
  topic?: string;
  contentType?: string;
  createdAt?: string;
  platformVariants?: Record<string, any>;
  outline?: Record<string, any>;
  draft?: { text?: string } | string;
  scripts?: Record<string, any>;
  source?: "server" | "local";
};

type ManualInputState = {
  topic: string;
  angle: string;
  targetAudience: string;
  goal: string;
  contentType: string;
  hookIdea: string;
  keyPointsText: string;
};

const toneOptions = ["professional", "casual", "humorous", "inspirational"];
const lengthOptions = ["short", "medium", "long"];
const hookOptions = ["question", "statistic", "story", "bold"];
const ctaOptions = ["subtle", "moderate", "strong"];

const platformOptions = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "blog", label: "Blog" },
];

const baseFieldStyle = {
  backgroundColor: "var(--color-background)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
} as const;

function formatDisplayValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatDisplayValue(item)).join("\n");
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ContentPage() {
  const router = useRouter();
  const { isAuthenticated, authReady, userInfo, token } = useAuth();
  const {
    contentList,
    customization,
    generatedContent,
    loading,
    error: contentError,
    setCustomization,
    fetchUserContent,
    setGeneratedContent,
  } = useContent();
  const [savedIdeas, setSavedIdeas] = useState<IdeaBrief[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const [inputMode, setInputMode] = useState<InputMode>("idea");
  const [selectedIdea, setSelectedIdea] = useState<IdeaItem | null>(null);
  const [localSavedContent, setLocalSavedContent] = useState<SavedContentItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [copiedBlock, setCopiedBlock] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [manualInput, setManualInput] = useState<ManualInputState>({
    topic: "",
    angle: "",
    targetAudience: "",
    goal: "engagement",
    contentType: "post",
    hookIdea: "",
    keyPointsText: "",
  });

  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    if (userInfo?.userId && token) {
      fetchUserContent(userInfo.userId);

      const localKey = `kindcrew-content-local-${userInfo.userId}`;
      try {
        const localData = localStorage.getItem(localKey);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            setLocalSavedContent(parsed as SavedContentItem[]);
          }
        }
      } catch (error) {
        console.error("Failed to load local saved content:", error);
      }
    }
  }, [userInfo?.userId, token, fetchUserContent]);

  useEffect(() => {
    const loadSavedIdeas = async () => {
      if (!token) return;

      setLoadingIdeas(true);
      try {
        const result = await getUserIdeas(token);
        if (result.success && Array.isArray(result.ideas)) {
          setSavedIdeas(result.ideas);
        } else {
          setSavedIdeas([]);
        }
      } catch (error) {
        console.error("Failed to load saved ideas:", error);
        setSavedIdeas([]);
      } finally {
        setLoadingIdeas(false);
      }
    };

    if (authReady && isAuthenticated() && token) {
      loadSavedIdeas();
    }
  }, [authReady, isAuthenticated, token]);

  const platformVariants = useMemo(() => {
    if (!generatedContent?.platformVariants || typeof generatedContent.platformVariants !== "object") {
      return [] as Array<[string, any]>;
    }

    return Object.entries(generatedContent.platformVariants);
  }, [generatedContent]);

  const scriptVariants = useMemo(() => {
    if (!generatedContent?.scripts || typeof generatedContent.scripts !== "object") {
      return [] as Array<[string, any]>;
    }

    return Object.entries(generatedContent.scripts);
  }, [generatedContent]);

  // Deduplicate merged saved content - prefer server content over local
  const mergedSavedContent = useMemo(() => {
    const serverContentIds = new Set(contentList.map(item => item.contentId));
    const uniqueLocalContent = localSavedContent.filter(
      item => !serverContentIds.has(item.contentId)
    );
    return [...contentList, ...uniqueLocalContent];
  }, [contentList, localSavedContent]);

  const keyPoints = useMemo(
    () =>
      manualInput.keyPointsText
        .split("\n")
        .map((point) => point.trim())
        .filter(Boolean),
    [manualInput.keyPointsText]
  );

  const isGenerateDisabled =
    isGenerating ||
    (inputMode === "idea" && !selectedIdea) ||
    (inputMode === "manual" &&
      (!manualInput.topic.trim() || customization.selectedPlatforms.length === 0));

  const togglePlatform = (platform: string) => {
    const isSelected = customization.selectedPlatforms.includes(platform);
    const nextPlatforms = isSelected
      ? customization.selectedPlatforms.filter((p) => p !== platform)
      : [...customization.selectedPlatforms, platform];

    setCustomization({ selectedPlatforms: nextPlatforms });
  };

  const copyContent = async (key: string, value: any) => {
    try {
      const textToCopy = typeof value === "string" ? value : JSON.stringify(value, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedBlock(key);
      setTimeout(() => setCopiedBlock(""), 1500);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
    }
  };

  const saveCurrentOutput = () => {
    if (!generatedContent || !userInfo?.userId) return;

    const localKey = `kindcrew-content-local-${userInfo.userId}`;
    
    // Generate or use existing contentId
    const contentIdToUse = generatedContent.contentId || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    
    // Check if this content is already saved (prevent duplicates)
    const alreadySaved = localSavedContent.some(item => item.contentId === contentIdToUse);
    
    if (alreadySaved) {
      setSaveMessage("This content is already saved in your library.");
      setTimeout(() => setSaveMessage(""), 1800);
      return;
    }
    
    const nextItem: SavedContentItem = {
      ...(generatedContent as SavedContentItem),
      contentId: contentIdToUse,
      topic:
        generatedContent.topic ||
        manualInput.topic ||
        selectedIdea?.topic ||
        selectedIdea?.title ||
        "Untitled Content",
      contentType: generatedContent.contentType || manualInput.contentType || "post",
      createdAt: new Date().toISOString(),
      source: "local",
    };

    const nextLocal = [nextItem, ...localSavedContent].slice(0, 30);
    setLocalSavedContent(nextLocal);
    localStorage.setItem(localKey, JSON.stringify(nextLocal));
    setSaveMessage("Saved to your local content library.");
    setTimeout(() => setSaveMessage(""), 1800);
  };

  const handleGenerateContent = async () => {
    setErrorMessage("");
    const activeUserId = userInfo?.userId;

    if (!activeUserId || !token) {
      setErrorMessage("Session user not found. Please refresh and try again.");
      return;
    }

    if (inputMode === "idea" && !selectedIdea) {
      setErrorMessage("Choose a saved idea to continue.");
      return;
    }

    if (inputMode === "manual") {
      if (!manualInput.topic.trim()) {
        setErrorMessage("Topic is required in manual mode.");
        return;
      }

      if (customization.selectedPlatforms.length === 0) {
        setErrorMessage("Select at least one platform in manual mode.");
        return;
      }
    }

    setIsGenerating(true);
    try {
      const selectedIdeaId = selectedIdea?.ideaId;

      if (inputMode === "idea" && !selectedIdeaId) {
        setErrorMessage("Selected idea is missing an ID. Please choose another idea.");
        return;
      }

      const ideaOwnerUserId = selectedIdea?.userId || activeUserId;

      const defaultIdeaPlatform =
        typeof (selectedIdea as any)?.platform === "string"
          ? ((selectedIdea as any).platform as string)
          : "linkedin";

      const selectedPlatforms =
        customization.selectedPlatforms.length > 0
          ? customization.selectedPlatforms
          : [defaultIdeaPlatform];

      const result =
        inputMode === "idea"
          ? await createContentFromIdea(token!, selectedIdeaId as string, {
              ideaUserId: ideaOwnerUserId,
              platforms: selectedPlatforms,
              preferences: {
                tone: customization.tone,
                length: customization.length,
                includeCTA: customization.ctaStrength !== "subtle",
              },
            })
          : await createContentFromManual(token!, {
              topic: manualInput.topic.trim(),
              angle: manualInput.angle.trim() || undefined,
              targetAudience: manualInput.targetAudience.trim() || undefined,
              goal: manualInput.goal,
              contentType: manualInput.contentType,
              hookIdea: manualInput.hookIdea.trim() || undefined,
              keyPoints,
              platforms: customization.selectedPlatforms,
              preferences: {
                tone: customization.tone,
                length: customization.length,
                includeCTA: customization.ctaStrength !== "subtle",
              },
            });

      if (result.success) {
        setGeneratedContent(result.content || null);
        if (activeUserId) {
          void fetchUserContent(activeUserId);
        }
      } else {
        setErrorMessage(result.error || "Failed to generate content.");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating content."
      );
    } finally {
      setIsGenerating(false);
    }
  };

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

  return (
    <AuthenticatedLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
            <div>
              <h1
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Content Studio
              </h1>
              <p
                className="text-base sm:text-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Pick a saved idea or write your own brief, then generate platform-ready drafts in one flow.
              </p>
            </div>

            <button
              onClick={() => router.push("/content/library")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              style={{
                backgroundColor: "var(--color-surface-hover)",
                color: "var(--color-text)",
              }}
            >
              <FiZap className="w-4 h-4" />
              View Content Library
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <section className="space-y-6">
            <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                1. Choose Input Mode
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("idea");
                    setGeneratedContent(null);
                    setErrorMessage("");
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor:
                      inputMode === "idea" ? "var(--color-surface-hover)" : "var(--color-background)",
                    color: "var(--color-text)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Use Saved Idea
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode("manual");
                    setSelectedIdea(null);
                    setGeneratedContent(null);
                    setErrorMessage("");
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor:
                      inputMode === "manual" ? "var(--color-surface-hover)" : "var(--color-background)",
                    color: "var(--color-text)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Enter Manually
                </button>
              </div>
            </div>

            {inputMode === "idea" ? (
              <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    2. Select Saved Idea
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/ideation")}
                    className="text-xs px-3 py-1.5 rounded-md font-medium"
                    style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)" }}
                  >
                    Open Ideation
                  </button>
                </div>

                {loadingIdeas ? (
                  <div className="rounded-xl p-4 text-sm" style={{ ...baseFieldStyle, color: "var(--color-text-secondary)" }}>
                    Loading saved ideas...
                  </div>
                ) : savedIdeas.length === 0 ? (
                  <div className="rounded-xl p-4 text-sm" style={{ ...baseFieldStyle, color: "var(--color-text-secondary)" }}>
                    No saved ideas yet. Create one from the Ideation page.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {savedIdeas.map((idea, index) => {
                      const active = selectedIdea?.ideaId === idea.ideaId;
                      const ideaKey =
                        idea.ideaId ||
                        `${idea.topic || "idea"}-${idea.angle || ""}-${index}`;
                      return (
                        <button
                          type="button"
                          key={ideaKey}
                          onClick={() => {
                            setSelectedIdea(idea);
                            setGeneratedContent(null);
                          }}
                          className="w-full text-left rounded-xl p-3 transition-colors"
                          style={{
                            backgroundColor: active ? "var(--color-surface-hover)" : "var(--color-background)",
                            border: active ? "1px solid var(--color-text)" : "1px solid var(--color-border)",
                          }}
                        >
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                            {idea.topic || idea.title || "Untitled Idea"}
                          </p>
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                            {idea.angle || idea.description || "No angle added"}
                          </p>
                          {typeof idea.scores?.virality === "number" && (
                            <span className="inline-block mt-2 text-xs px-2 py-1 rounded" style={{ ...baseFieldStyle, color: "var(--color-text-secondary)" }}>
                              Virality: {Math.round(idea.scores.virality)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedIdea && (
                  <div className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ ...baseFieldStyle }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Selected Idea:</span>{" "}
                    <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
                      {selectedIdea.topic || selectedIdea.title || "Untitled Idea"}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                  2. Write Your Brief
                </p>
                <div className="space-y-3">
                  <input
                    value={manualInput.topic}
                    onChange={(e) => setManualInput((prev) => ({ ...prev, topic: e.target.value }))}
                    placeholder="Topic *"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={baseFieldStyle}
                  />
                  <input
                    value={manualInput.angle}
                    onChange={(e) => setManualInput((prev) => ({ ...prev, angle: e.target.value }))}
                    placeholder="Angle"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={baseFieldStyle}
                  />
                  <input
                    value={manualInput.targetAudience}
                    onChange={(e) => setManualInput((prev) => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="Target audience"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={baseFieldStyle}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={manualInput.goal}
                      onChange={(e) => setManualInput((prev) => ({ ...prev, goal: e.target.value }))}
                      className="rounded-lg px-3 py-2 text-sm"
                      style={baseFieldStyle}
                    >
                      <option value="engagement">Goal: Engagement</option>
                      <option value="growth">Goal: Growth</option>
                      <option value="authority">Goal: Authority</option>
                      <option value="conversion">Goal: Conversion</option>
                    </select>
                    <select
                      value={manualInput.contentType}
                      onChange={(e) => setManualInput((prev) => ({ ...prev, contentType: e.target.value }))}
                      className="rounded-lg px-3 py-2 text-sm"
                      style={baseFieldStyle}
                    >
                      <option value="post">Type: Post</option>
                      <option value="thread">Type: Thread</option>
                      <option value="carousel">Type: Carousel</option>
                      <option value="video">Type: Video Script</option>
                    </select>
                  </div>

                  <input
                    value={manualInput.hookIdea}
                    onChange={(e) => setManualInput((prev) => ({ ...prev, hookIdea: e.target.value }))}
                    placeholder="Hook idea"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={baseFieldStyle}
                  />
                  <textarea
                    rows={5}
                    value={manualInput.keyPointsText}
                    onChange={(e) => setManualInput((prev) => ({ ...prev, keyPointsText: e.target.value }))}
                    placeholder="Key points (one per line)"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={baseFieldStyle}
                  />
                </div>
              </div>
            )}

            <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <div className="flex items-center gap-2 mb-4">
                <FiZap className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  3. Customize Generation
                </p>
              </div>

              {inputMode === "idea" && selectedIdea && (
                <p className="text-xs mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  Using: <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{selectedIdea.topic || selectedIdea.title || "Untitled Idea"}</span>
                </p>
              )}

              <div className="space-y-4">
                <OptionGroup
                  title="Tone"
                  options={toneOptions}
                  value={customization.tone}
                  onChange={(next) => setCustomization({ tone: next })}
                />
                <OptionGroup
                  title="Length"
                  options={lengthOptions}
                  value={customization.length}
                  onChange={(next) => setCustomization({ length: next })}
                />
                <OptionGroup
                  title="Hook Style"
                  options={hookOptions}
                  value={customization.hookStyle}
                  onChange={(next) => setCustomization({ hookStyle: next })}
                />
                <OptionGroup
                  title="CTA Strength"
                  options={ctaOptions}
                  value={customization.ctaStrength}
                  onChange={(next) => setCustomization({ ctaStrength: next })}
                />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      Platforms {inputMode === "manual" && <span style={{ color: "#dc2626" }}>*</span>}
                    </p>
                    <p className="text-xs" style={{ color: customization.selectedPlatforms.length === 0 && inputMode === "manual" ? "#dc2626" : "var(--color-text-secondary)" }}>
                      {customization.selectedPlatforms.length} selected
                      {customization.selectedPlatforms.length === 0 && inputMode === "manual" && " (required)"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {platformOptions.map((platform) => {
                      const active = customization.selectedPlatforms.includes(platform.value);
                      return (
                        <button
                          key={platform.value}
                          type="button"
                          onClick={() => togglePlatform(platform.value)}
                          className="px-3 py-1.5 text-sm rounded-full transition-colors"
                          style={{
                            backgroundColor: active ? "var(--color-surface-hover)" : "var(--color-background)",
                            color: "var(--color-text)",
                            border: active ? "1px solid var(--color-text)" : "1px solid var(--color-border)",
                          }}
                        >
                          {platform.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <p className="mt-4 text-sm" style={{ color: "#dc2626" }}>
                  {errorMessage}
                </p>
              )}

              {inputMode === "manual" && !manualInput.topic.trim() && (
                <p className="mt-4 text-sm" style={{ color: "#dc2626" }}>
                  Please enter a topic to continue
                </p>
              )}

              {inputMode === "manual" &&
                manualInput.topic.trim() &&
                customization.selectedPlatforms.length === 0 && (
                  <p className="mt-4 text-sm" style={{ color: "#dc2626" }}>
                    Please select at least one platform above to continue
                  </p>
                )}

              <button
                type="button"
                onClick={handleGenerateContent}
                disabled={isGenerateDisabled}
                className="mt-5 w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}
              >
                {isGenerating ? "Generating..." : "Generate Content"}
              </button>
            </div>

            {/* Saved Content Library - Moved below customize section */}
            <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  4. Saved Content Library
                </p>
                <button
                  type="button"
                  onClick={() => userInfo?.userId && fetchUserContent(userInfo.userId)}
                  className="text-xs px-2.5 py-1.5 rounded-md"
                  style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)" }}
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Loading saved content...
                </p>
              ) : mergedSavedContent.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  No saved content yet. Generated items will appear here automatically.
                </p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {mergedSavedContent.slice(0, 12).map((item) => (
                    <button
                      type="button"
                      key={item.contentId}
                      onClick={() => setGeneratedContent(item as Record<string, any>)}
                      className="w-full text-left rounded-xl p-3 transition-colors"
                      style={{
                        backgroundColor: "var(--color-background)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                        {item.topic || "Untitled Content"}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        {item.contentType || "post"} {item.createdAt ? `• ${new Date(item.createdAt).toLocaleDateString()}` : ""}
                        {item.source === "local" ? " • local" : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {generatedContent && (
              <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      Generated Output
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Topic: {generatedContent.topic || manualInput.topic || selectedIdea?.topic || "-"}
                    </p>
                  </div>
                  <button
                    onClick={() => setGeneratedContent(null)}
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)" }}
                  >
                    Generate Another
                  </button>
                </div>

                {generatedContent.outline && (
                  <div className="mb-5 rounded-xl p-4" style={baseFieldStyle}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Outline
                      </p>
                      <button
                        onClick={() => copyContent("outline", generatedContent.outline)}
                        className="text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1"
                        style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}
                      >
                        {copiedBlock === "outline" ? <FiCheckCircle className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                        {copiedBlock === "outline" ? "Copied" : "Copy All"}
                      </button>
                    </div>
                    {generatedContent.outline.title && (
                      <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
                        <span style={{ color: "var(--color-text)" }}>Title:</span> {generatedContent.outline.title}
                      </p>
                    )}
                    {generatedContent.outline.hook && (
                      <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
                        <span style={{ color: "var(--color-text)" }}>Hook:</span> {generatedContent.outline.hook}
                      </p>
                    )}
                    {Array.isArray(generatedContent.outline.sections) && generatedContent.outline.sections.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>Sections</p>
                        <ul className="space-y-1">
                          {generatedContent.outline.sections.map((point: unknown, index: number) => (
                            <li key={index} className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                              {index + 1}. {formatDisplayValue(point)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {generatedContent.outline.cta && (
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        <span style={{ color: "var(--color-text)" }}>CTA:</span> {generatedContent.outline.cta}
                      </p>
                    )}
                  </div>
                )}

                {(typeof generatedContent.draft === "string" || typeof generatedContent.draft?.text === "string") && (
                  <div className="mb-5 rounded-xl p-4" style={baseFieldStyle}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Draft
                      </p>
                      <button
                        onClick={() =>
                          copyContent(
                            "draft",
                            typeof generatedContent.draft === "string"
                              ? generatedContent.draft
                              : generatedContent.draft?.text || ""
                          )
                        }
                        className="text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1"
                        style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}
                      >
                        {copiedBlock === "draft" ? <FiCheckCircle className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                        {copiedBlock === "draft" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                      {typeof generatedContent.draft === "string"
                        ? generatedContent.draft
                        : generatedContent.draft?.text}
                    </p>
                  </div>
                )}

                {platformVariants.length > 0 && (
                  <div className="mb-5">
                    <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                      Platform Variants
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {platformVariants.map(([platform, value]) => (
                        <StructuredOutputCard
                          key={platform}
                          title={platform}
                          value={value}
                          copied={copiedBlock === `variant-${platform}`}
                          onCopy={() => copyContent(`variant-${platform}`, value)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {scriptVariants.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                      Scripts
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {scriptVariants.map(([platform, value]) => (
                        <StructuredOutputCard
                          key={platform}
                          title={`${platform} script`}
                          value={value}
                          copied={copiedBlock === `script-${platform}`}
                          onCopy={() => copyContent(`script-${platform}`, value)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={saveCurrentOutput}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}
                  >
                    Save Current Output
                  </button>
                  <button
                    onClick={() => router.push("/content/library")}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: "var(--color-primary)", color: "white" }}
                  >
                    View Content Library
                  </button>
                  <button
                    onClick={() => router.push("/analytics")}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}
                  >
                    Continue to Analytics
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                  >
                    Back to Dashboard
                  </button>
                </div>
                {saveMessage && (
                  <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {saveMessage}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function OptionGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              type="button"
              key={option}
              onClick={() => onChange(option)}
              className="px-3 py-1.5 text-sm rounded-lg capitalize transition-colors"
              style={{
                backgroundColor: active ? "var(--color-surface-hover)" : "var(--color-background)",
                color: "var(--color-text)",
                border: active ? "1px solid var(--color-text)" : "1px solid var(--color-border)",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StructuredOutputCard({
  title,
  value,
  copied,
  onCopy,
}: {
  title: string;
  value: any;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-semibold capitalize" style={{ color: "var(--color-text)" }}>
          {title}
        </p>
        <button
          onClick={onCopy}
          className="text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1"
          style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}
        >
          {copied ? <FiCheckCircle className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {typeof value === "string" ? (
        <pre
          className="text-xs whitespace-pre-wrap break-words"
          style={{ color: "var(--color-text-secondary)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
        >
          {value}
        </pre>
      ) : (
        <div className="space-y-2">
          {Object.entries(value || {}).map(([field, fieldValue]) => (
            <div key={field} className="rounded-lg p-2" style={{ border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold capitalize mb-1" style={{ color: "var(--color-text)" }}>
                {field}
              </p>
              <pre
                className="text-xs whitespace-pre-wrap break-words"
                style={{ color: "var(--color-text-secondary)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              >
                {formatDisplayValue(fieldValue)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)" }}>
      <div className="inline-flex p-2 rounded-lg mb-3" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}>
        {icon}
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
        {title}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
        {subtitle}
      </p>
    </div>
  );
}

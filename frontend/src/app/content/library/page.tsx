"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { getUserContent, regenerateVariant, updateDistributionStatus } from "@/lib/api/content";
import { FiArrowLeft, FiCopy, FiCheck } from "react-icons/fi";

interface PlatformVariant {
  platform: string;
  [key: string]: any;
}

interface ContentItem {
  contentId: string;
  userId: string;
  source: string;
  topic: string;
  targetAudience: string;
  contentType: string;
  outline: any;
  draft: any;
  platformVariants: Record<string, PlatformVariant>;
  scripts?: Record<string, any>;
  distribution: {
    status: string;
    platformTargets: string[];
  };
  createdAt: string;
}

export default function ContentLibrary() {
  const router = useRouter();
  const { isAuthenticated, authReady, userInfo, token } = useAuth();
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [localContentList, setLocalContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [regenerating, setRegenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    if (userInfo?.userId && token) {
      loadContent();
    }
  }, [userInfo?.userId, token]);

  useEffect(() => {
    if (userInfo?.userId && contentList.length >= 0) {
      loadLocalContent();
    }
  }, [userInfo?.userId, contentList]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const userId = userInfo?.userId;
      if (!userId || !token) return;
      
      const result = await getUserContent(token);

      if (result.success) {
        setContentList(result.content || []);
      }
    } catch (err: any) {
      console.error("Error loading content:", err);
      setError(err.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const loadLocalContent = () => {
    try {
      const userId = userInfo?.userId;
      if (!userId) return;
      
      const localKey = `kindcrew-content-local-${userId}`;
      const localData = localStorage.getItem(localKey);
      
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          // Deduplicate: Remove local items that already exist on server
          const serverContentIds = new Set(contentList.map(item => item.contentId));
          const uniqueLocalContent = parsed.filter(
            (item: ContentItem) => !serverContentIds.has(item.contentId)
          );
          setLocalContentList(uniqueLocalContent as ContentItem[]);
        }
      }
    } catch (err: any) {
      console.error("Error loading local content:", err);
    }
  };

  const handleRegenerateVariant = async (contentId: string, platform: string) => {
    try {
      setRegenerating(true);
      const userId = userInfo?.userId;
      if (!userId || !token) return;
      
      const result = await regenerateVariant(token, contentId, platform);

      if (result.success) {
        // Reload content to get updated variant
        await loadContent();
        alert(`${platform} variant regenerated successfully!`);
      }
    } catch (err: any) {
      console.error("Error regenerating variant:", err);
      alert(err.message || "Failed to regenerate variant");
    } finally {
      setRegenerating(false);
    }
  };

  const handleStatusUpdate = async (contentId: string, status: string) => {
    try {
      const userId = userInfo?.userId;
      if (!userId || !token) return;
      
      await updateDistributionStatus(token, contentId, status as any);
      await loadContent();
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(err.message || "Failed to update status");
    }
  };

  const handleDeleteLocal = (contentId: string) => {
    try {
      const userId = userInfo?.userId;
      if (!userId) return;
      
      const updatedLocal = localContentList.filter(item => item.contentId !== contentId);
      setLocalContentList(updatedLocal);
      
      const localKey = `kindcrew-content-local-${userId}`;
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));
    } catch (err: any) {
      console.error("Error deleting local content:", err);
      alert("Failed to delete local content");
    }
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const copyButton = (copyKey: string, text: string) => (
    <button
      type="button"
      onClick={() => copyText(text, copyKey)}
      className="px-2.5 py-1 rounded text-xs font-medium inline-flex items-center gap-1"
      style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}
    >
      {copiedKey === copyKey ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
      {copiedKey === copyKey ? "Copied" : "Copy"}
    </button>
  );

  const formatVariantForCopy = (platform: string, variant: PlatformVariant) => {
    switch (platform) {
      case "linkedin":
        return [
          variant.postText ? `Post Text:\n${variant.postText}` : "",
          Array.isArray(variant.hashtags) && variant.hashtags.length ? `Hashtags:\n${variant.hashtags.join(" ")}` : "",
          variant.estimatedReadingTime ? `Estimated Reading Time: ${variant.estimatedReadingTime}` : "",
        ].filter(Boolean).join("\n\n");
      case "twitter":
        return [
          Array.isArray(variant.thread)
            ? `Thread:\n${variant.thread.map((t: string, i: number) => `Tweet ${i + 1}: ${t}`).join("\n\n")}`
            : "",
          Array.isArray(variant.hashtags) && variant.hashtags.length ? `Hashtags:\n${variant.hashtags.join(" ")}` : "",
        ].filter(Boolean).join("\n\n");
      case "instagram":
        return [
          variant.caption ? `Caption:\n${variant.caption}` : "",
          variant.coverText ? `Cover Text:\n${variant.coverText}` : "",
          Array.isArray(variant.hashtags) && variant.hashtags.length ? `Hashtags:\n${variant.hashtags.join(" ")}` : "",
          variant.altText ? `Alt Text:\n${variant.altText}` : "",
        ].filter(Boolean).join("\n\n");
      case "reddit":
        return [
          variant.title ? `Title:\n${variant.title}` : "",
          variant.postBody ? `Post Body:\n${variant.postBody}` : "",
          Array.isArray(variant.subredditSuggestions) && variant.subredditSuggestions.length
            ? `Suggested Subreddits:\n${variant.subredditSuggestions.map((s: string) => `r/${s}`).join("\n")}`
            : "",
        ].filter(Boolean).join("\n\n");
      case "youtube":
        return [
          variant.title ? `Title:\n${variant.title}` : "",
          variant.description ? `Description:\n${variant.description}` : "",
          Array.isArray(variant.tags) && variant.tags.length ? `Tags:\n${variant.tags.join(", ")}` : "",
          variant.thumbnailText ? `Thumbnail Text:\n${variant.thumbnailText}` : "",
        ].filter(Boolean).join("\n\n");
      case "medium":
        return [
          variant.title ? `Title:\n${variant.title}` : "",
          variant.subtitle ? `Subtitle:\n${variant.subtitle}` : "",
          variant.body ? `Body:\n${variant.body}` : "",
          Array.isArray(variant.tags) && variant.tags.length ? `Tags:\n${variant.tags.join(", ")}` : "",
        ].filter(Boolean).join("\n\n");
      default:
        return Object.entries(variant)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v ?? "")}`)
          .join("\n");
    }
  };

  const renderPlatformVariant = (platform: string, variant: PlatformVariant) => {
    switch (platform) {
      case "linkedin":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Post Text</h4>
                {copyButton("linkedin-post", variant.postText || "")}
              </div>
              <p className="whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{variant.postText}</p>
            </div>
            {Array.isArray(variant.hashtags) && variant.hashtags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Hashtags</h4>
                  {copyButton("linkedin-tags", variant.hashtags.join(" "))}
                </div>
                <p style={{ color: "#3b82f6" }}>{variant.hashtags.join(" ")}</p>
              </div>
            )}
            {variant.estimatedReadingTime && (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Reading time: {variant.estimatedReadingTime}</p>
            )}
          </div>
        );

      case "twitter":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Thread ({variant.tweetCount || variant.thread?.length || 0} tweets)</h4>
              {copyButton("twitter-thread", formatVariantForCopy("twitter", variant))}
            </div>
            <div className="space-y-3">
              {variant.thread?.map((tweet: string, index: number) => (
                <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Tweet {index + 1}</span>
                    {copyButton(`twitter-tweet-${index}`, tweet)}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{tweet}</p>
                </div>
              ))}
            </div>
            {Array.isArray(variant.hashtags) && variant.hashtags.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: "#3b82f6" }}>{variant.hashtags.join(" ")}</p>
                {copyButton("twitter-tags", variant.hashtags.join(" "))}
              </div>
            )}
          </div>
        );

      case "instagram":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Caption</h4>
                {copyButton("instagram-caption", variant.caption || "")}
              </div>
              <p className="whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{variant.caption}</p>
            </div>
            {variant.coverText && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Cover Text</h4>
                  {copyButton("instagram-cover", variant.coverText)}
                </div>
                <p style={{ color: "var(--color-text)" }}>{variant.coverText}</p>
              </div>
            )}
            {Array.isArray(variant.hashtags) && variant.hashtags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Hashtags</h4>
                  {copyButton("instagram-tags", variant.hashtags.join(" "))}
                </div>
                <p className="text-sm" style={{ color: "#3b82f6" }}>{variant.hashtags.join(" ")}</p>
              </div>
            )}
            {variant.altText && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Alt Text</h4>
                  {copyButton("instagram-alt", variant.altText)}
                </div>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{variant.altText}</p>
              </div>
            )}
          </div>
        );

      case "reddit":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Title</h4>
                {copyButton("reddit-title", variant.title || "")}
              </div>
              <p className="font-medium" style={{ color: "var(--color-text)" }}>{variant.title}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Post Body</h4>
                {copyButton("reddit-body", variant.postBody || "")}
              </div>
              <p className="whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{variant.postBody}</p>
            </div>
            {Array.isArray(variant.subredditSuggestions) && variant.subredditSuggestions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Suggested Subreddits</h4>
                  {copyButton("reddit-subs", variant.subredditSuggestions.map((s: string) => `r/${s}`).join("\n"))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {variant.subredditSuggestions.map((sub: string) => (
                    <span key={sub} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: "#fed7aa", color: "#c2410c" }}>
                      r/{sub}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "youtube":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Title</h4>
                {copyButton("youtube-title", variant.title || "")}
              </div>
              <p className="font-medium" style={{ color: "var(--color-text)" }}>{variant.title}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Description</h4>
                {copyButton("youtube-description", variant.description || "")}
              </div>
              <p className="whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{variant.description}</p>
            </div>
            {Array.isArray(variant.tags) && variant.tags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Tags</h4>
                  {copyButton("youtube-tags", variant.tags.join(", "))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {variant.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: "#fecaca", color: "#b91c1c" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {variant.thumbnailText && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Thumbnail Text</h4>
                  {copyButton("youtube-thumbnail", variant.thumbnailText)}
                </div>
                <p style={{ color: "var(--color-text)" }}>{variant.thumbnailText}</p>
              </div>
            )}
          </div>
        );

      case "medium":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Title</h4>
                {copyButton("medium-title", variant.title || "")}
              </div>
              <p className="font-medium text-xl" style={{ color: "var(--color-text)" }}>{variant.title}</p>
            </div>
            {variant.subtitle && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Subtitle</h4>
                  {copyButton("medium-subtitle", variant.subtitle)}
                </div>
                <p style={{ color: "var(--color-text-secondary)" }}>{variant.subtitle}</p>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Body</h4>
                {copyButton("medium-body", variant.body || "")}
              </div>
              <p className="whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{variant.body}</p>
            </div>
            {Array.isArray(variant.tags) && variant.tags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold" style={{ color: "var(--color-text)" }}>Tags</h4>
                  {copyButton("medium-tags", variant.tags.join(", "))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {variant.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            {Object.entries(variant).map(([key, value]) => {
              const text = Array.isArray(value) ? value.join("\n") : String(value ?? "");
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold capitalize" style={{ color: "var(--color-text)" }}>{key}</h4>
                    {copyButton(`default-${key}`, text)}
                  </div>
                  <p className="whitespace-pre-wrap text-sm" style={{ color: "var(--color-text-secondary)" }}>{text}</p>
                </div>
              );
            })}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 rounded-full mx-auto mb-4" style={{ borderColor: "var(--color-border)", borderTopColor: "transparent" }}></div>
            <p style={{ color: "var(--color-text-secondary)" }}>Loading your content library...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--color-text)" }}>Content Library</h1>
              <p className="text-base sm:text-lg" style={{ color: "var(--color-text-secondary)" }}>View and manage your generated content</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/content")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: "var(--color-surface-hover)",
                  color: "var(--color-text)",
                }}
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Content Studio
              </button>
              <Link
                href="/content"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                style={{
                  backgroundColor: "var(--color-text)",
                  color: "var(--color-background)",
                }}
              >
                + Create New Content
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg mb-6" style={{ backgroundColor: "var(--color-surface)", border: "1px solid #dc2626", color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* Server Content */}
        {contentList.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-text)" }}>Saved Content (Server)</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {contentList.map(content => (
                <div key={content.contentId} className="rounded-2xl p-6 h-full flex flex-col" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  {/* Content Header */}
                  <div className="mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>{content.topic}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}>
                        {content.source === "phase1" ? "From Ideation" : "Manual"}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {content.contentType}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        content.distribution.status === "published"
                          ? "bg-green-100 text-green-700"
                          : content.distribution.status === "scheduled"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {content.distribution.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Audience: {content.targetAudience} | Created: {new Date(content.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Platform Tabs */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(content.platformVariants).map(platform => (
                        <button
                          key={platform}
                          onClick={() => {
                            setSelectedContent(content);
                            setSelectedPlatform(platform);
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: "var(--color-surface-hover)",
                            color: "var(--color-text)",
                            border: "1px solid var(--color-border)"
                          }}
                        >
                          View {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto flex gap-2">
                    {content.distribution.status === "draft" && (
                      <button
                        onClick={() => handleStatusUpdate(content.contentId, "scheduled")}
                        className="flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        style={{
                          backgroundColor: "var(--color-text)",
                          color: "var(--color-background)"
                        }}
                      >
                        Schedule
                      </button>
                    )}
                    <Link
                      href={`/content/${content.contentId}`}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-center"
                      style={{
                        backgroundColor: "var(--color-surface-hover)",
                        color: "var(--color-text)"
                      }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local Content */}
        {localContentList.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-text)" }}>Local Saved Content</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {localContentList.map(content => (
                <div key={content.contentId} className="rounded-2xl p-6 h-full flex flex-col" style={{ backgroundColor: "var(--color-surface)", border: "2px solid #fb923c" }}>
                  {/* Content Header */}
                  <div className="mb-4 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{content.topic}</h3>
                      <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: "#fed7aa", color: "#c2410c" }}>LOCAL</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text)" }}>
                        {content.contentType}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Created: {new Date(content.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Platform Tabs */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {content.platformVariants && Object.keys(content.platformVariants).map(platform => (
                        <button
                          key={platform}
                          onClick={() => {
                            setSelectedContent(content);
                            setSelectedPlatform(platform);
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: "#fed7aa",
                            color: "#c2410c",
                            border: "1px solid #fb923c"
                          }}
                        >
                          View {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => handleDeleteLocal(content.contentId)}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      style={{
                        backgroundColor: "#fee2e2",
                        color: "#dc2626"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {contentList.length === 0 && localContentList.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <p className="mb-6" style={{ color: "var(--color-text-secondary)" }}>You haven't generated any content yet</p>
            <Link
              href="/content"
              className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{
                backgroundColor: "var(--color-text)",
                color: "var(--color-background)",
              }}
            >
              Create Your First Content
            </Link>
          </div>
        ) : null}

        {/* Platform Variant Modal */}
        {selectedContent && selectedPlatform && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
            <div className="rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="sticky top-0 p-6" style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Variant
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedContent(null);
                      setSelectedPlatform("");
                    }}
                    className="text-2xl transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6">
                {renderPlatformVariant(selectedPlatform, selectedContent.platformVariants[selectedPlatform])}
                <div className="mt-6 pt-6 flex gap-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <button
                    onClick={() => handleRegenerateVariant(selectedContent.contentId, selectedPlatform)}
                    disabled={regenerating}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold transition-colors"
                    style={{
                      backgroundColor: regenerating ? "var(--color-surface-hover)" : "var(--color-text)",
                      color: regenerating ? "var(--color-text-secondary)" : "var(--color-background)",
                      cursor: regenerating ? "not-allowed" : "pointer"
                    }}
                  >
                    {regenerating ? "Regenerating..." : "Regenerate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(
                      formatVariantForCopy(
                        selectedPlatform,
                        selectedContent.platformVariants[selectedPlatform],
                      ),
                      `modal-${selectedPlatform}`,
                    )}
                    className="px-4 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      color: "var(--color-text)"
                    }}
                  >
                    {copiedKey === `modal-${selectedPlatform}` ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                    {copiedKey === `modal-${selectedPlatform}` ? "Copied" : "Copy All"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

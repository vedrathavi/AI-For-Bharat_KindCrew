"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { getContentById } from "@/lib/api/content";
import ReactMarkdown from "react-markdown";
import {
  FiArrowLeft,
  FiCopy,
  FiCheck,
  FiDownload,
  FiEdit3,
} from "react-icons/fi";

interface PlatformVariant {
  platform: string;
  postText?: string;
  thread?: string[];
  caption?: string;
  hashtags?: string[];
  [key: string]: any;
}

interface ContentItem {
  contentId: string;
  userId: string;
  source: string;
  ideaId?: string;
  topic: string;
  angle?: string;
  targetAudience: string;
  contentType: string;
  outline: {
    title?: string;
    hook?: string;
    sections?: string[];
    cta?: string;
    contentFormat?: string;
    estimatedWordCount?: number;
  };
  draft: {
    text?: string;
  };
  platformVariants: Record<string, PlatformVariant>;
  scripts?: Record<string, any>;
  distribution: {
    status: string;
    platformTargets: string[];
  };
  createdAt: string;
  updatedAt?: string;
}

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.contentId as string;
  const { isAuthenticated, authReady, userInfo, token } = useAuth();
  
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const safeText = (val: any): string => {
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

  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    if (userInfo?.userId && token && contentId) {
      loadContent();
    }
  }, [userInfo?.userId, token, contentId]);

  useEffect(() => {
    if (content && content.platformVariants) {
      const platforms = Object.keys(content.platformVariants);
      if (platforms.length > 0 && !selectedPlatform) {
        setSelectedPlatform(platforms[0]);
      }
    }
  }, [content]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = userInfo?.userId;
      if (!userId || !token) return;

      const result = await getContentById(token, contentId);

      if (result.success && result.content) {
        setContent(result.content);
      } else {
        setError(result.error || "Content not found");
      }
    } catch (err: any) {
      console.error("Error loading content:", err);
      setError(err.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPlatformContent = (platform: string, variant: PlatformVariant) => {
    return (
      <div className="space-y-4">
        {variant.postText && (
          <div
            className="p-4 rounded-xl whitespace-pre-wrap"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h4
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-muted)" }}
              >
                Post Text
              </h4>
              <button
                onClick={() => handleCopy(variant.postText!, `${platform}-post`)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: copiedSection === `${platform}-post` ? "var(--color-surface)" : "transparent",
                  color: "var(--color-text)",
                }}
              >
                {copiedSection === `${platform}-post` ? (
                  <FiCheck className="w-4 h-4" />
                ) : (
                  <FiCopy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div style={{ color: "var(--color-text)" }}>
              <ReactMarkdown>{safeText(variant.postText)}</ReactMarkdown>
            </div>
          </div>
        )}

        {variant.thread && Array.isArray(variant.thread) && (
          <div className="space-y-2">
            <h4
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Thread ({variant.thread.length} tweets)
            </h4>
            {variant.thread.map((tweet, index) => (
              <div
                key={index}
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: "var(--color-surface-hover)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Tweet {index + 1}
                  </span>
                  <button
                    onClick={() => handleCopy(tweet, `${platform}-tweet-${index}`)}
                    className="p-1 rounded transition-colors"
                    style={{ color: "var(--color-text)" }}
                  >
                    {copiedSection === `${platform}-tweet-${index}` ? (
                      <FiCheck className="w-3 h-3" />
                    ) : (
                      <FiCopy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="text-sm" style={{ color: "var(--color-text)" }}>
                  {safeText(tweet)}
                </p>
              </div>
            ))}
          </div>
        )}

        {variant.caption && (
          <div
            className="p-4 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h4
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-muted)" }}
              >
                Caption
              </h4>
              <button
                onClick={() => handleCopy(variant.caption!, `${platform}-caption`)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--color-text)" }}
              >
                {copiedSection === `${platform}-caption` ? (
                  <FiCheck className="w-4 h-4" />
                ) : (
                  <FiCopy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>
              {safeText(variant.caption)}
            </p>
          </div>
        )}

        {variant.hashtags && variant.hashtags.length > 0 && (
          <div
            className="p-4 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h4
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-muted)" }}
              >
                Hashtags
              </h4>
              <button
                onClick={() => handleCopy(variant.hashtags!.join(" "), `${platform}-hashtags`)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--color-text)" }}
              >
                {copiedSection === `${platform}-hashtags` ? (
                  <FiCheck className="w-4 h-4" />
                ) : (
                  <FiCopy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {variant.hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                >
                  {safeText(tag)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="w-full max-w-7xl mx-auto">
          <div
            className="rounded-xl p-12 text-center"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "var(--color-text)" }}></div>
            <p style={{ color: "var(--color-text-secondary)" }}>Loading content...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !content) {
    return (
      <AuthenticatedLayout>
        <div className="w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push("/content/library")}
              className="mb-4 flex items-center gap-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Library
            </button>
          </div>
          <div
            className="rounded-xl p-8 text-center"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              Content Not Found
            </p>
            <p style={{ color: "var(--color-text-secondary)" }}>
              {error || "The content you're looking for doesn't exist or you don't have access to it."}
            </p>
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
          <button
            onClick={() => router.push("/content/library")}
            className="mb-4 flex items-center gap-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Library
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                {safeText(content.outline?.title) || safeText(content.topic)}
              </h1>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Created {formatDate(content.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: "var(--color-surface-hover)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {safeText(content.contentType)}
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: content.distribution?.status === "published" 
                    ? "#dcfce7" 
                    : "var(--color-surface-hover)",
                  color: content.distribution?.status === "published" 
                    ? "#166534" 
                    : "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {content.distribution?.status || "draft"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Outline & Draft */}
          <div className="lg:col-span-1 space-y-6">
            {/* Outline */}
            {content.outline && (
              <div
                className="rounded-xl p-5"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h2
                  className="text-lg font-bold mb-4"
                  style={{ color: "var(--color-text)" }}
                >
                  Outline
                </h2>
                
                {content.outline.hook && (
                  <div className="mb-4">
                    <h3
                      className="text-sm font-semibold mb-2"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Hook
                    </h3>
                    <p className="text-sm" style={{ color: "var(--color-text)" }}>
                      {content.outline.hook}
                    </p>
                  </div>
                )}

                {content.outline.sections && content.outline.sections.length > 0 && (
                  <div className="mb-4">
                    <h3
                      className="text-sm font-semibold mb-2"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Sections
                    </h3>
                    <ul className="space-y-2">
                      {content.outline.sections.map((section, index) => (
                        <li
                          key={index}
                          className="text-sm flex gap-2"
                          style={{ color: "var(--color-text)" }}
                        >
                          <span style={{ color: "var(--color-text-muted)" }}>
                            {index + 1}.
                          </span>
                          {section}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {content.outline.cta && (
                  <div>
                    <h3
                      className="text-sm font-semibold mb-2"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Call to Action
                    </h3>
                    <p className="text-sm" style={{ color: "var(--color-text)" }}>
                      {content.outline.cta}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: "var(--color-text)" }}
              >
                Details
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Audience:</span>{" "}
                  <span style={{ color: "var(--color-text)" }}>
                    {content.targetAudience}
                  </span>
                </div>
                {content.angle && (
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Angle:</span>{" "}
                    <span style={{ color: "var(--color-text)" }}>{content.angle}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Source:</span>{" "}
                  <span style={{ color: "var(--color-text)" }}>
                    {content.source === "phase1" ? "From Idea" : "Manual"}
                  </span>
                </div>
                {content.ideaId && (
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Idea ID:</span>{" "}
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--color-text)" }}
                    >
                      {content.ideaId.slice(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Platform Variants */}
          <div className="lg:col-span-2">
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  Platform Content
                </h2>
              </div>

              {/* Platform Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {Object.keys(content.platformVariants || {}).map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor:
                        selectedPlatform === platform
                          ? "var(--color-text)"
                          : "var(--color-surface-hover)",
                      color:
                        selectedPlatform === platform
                          ? "var(--color-background)"
                          : "var(--color-text)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </button>
                ))}
              </div>

              {/* Platform Content */}
              {selectedPlatform && content.platformVariants[selectedPlatform] && (
                <div>
                  {renderPlatformContent(
                    selectedPlatform,
                    content.platformVariants[selectedPlatform]
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { getContentById } from "@/lib/api/content";
import { MarkdownRenderer, formatStructuredContent } from "@/components/ui/MarkdownRenderer";
import { Badge } from "@/components/ui/Badge";
import {
  FiArrowLeft,
  FiCopy,
  FiCheck,
  FiTarget,
  FiAlertCircle,
  FiLayers,
  FiVideo,
  FiHash,
  FiBookmark,
} from "react-icons/fi";
import {
  getPlatformIcon,
  getPlatformDisplayName,
  PlatformBadge,
  FormatBadge,
} from "@/lib/platformConfig";

export { getPlatformIcon };

interface PlatformVariant {
  platform: string;
  title?: string;
  subtitle?: string;
  postText?: string;
  postBody?: string;
  description?: string;
  caption?: string;
  body?: string;
  thread?: string[];
  hashtags?: string[];
  tags?: string[];
  chapters?: string[];
  thumbnailText?: string;
  shortHook?: string;
  altText?: string;
  coverText?: string;
  subredditSuggestions?: string[];
  estimatedReadingTime?: string;
  readingTime?: string;
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

type OutlineSection =
  | string
  | {
      title?: string;
      estimatedWordCount?: number;
      content?: string;
    };

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.contentId as string;
  const { authReady, userInfo, token } = useAuth();
  const authenticated = !!token && !!userInfo;

  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const safeText = (val: any): string => {
    return formatStructuredContent(val);
  };

  useEffect(() => {
    if (authReady && !authenticated) {
      router.replace("/");
    }
  }, [authReady, authenticated, router]);

  useEffect(() => {
    if (authReady && authenticated && userInfo?.userId && token && contentId) {
      loadContent();
    }
  }, [authReady, authenticated, userInfo?.userId, token, contentId]);

  useEffect(() => {
    if (content && content.platformVariants) {
      const platforms = Object.keys(content.platformVariants);
      if (platforms.length > 0 && !selectedPlatform) {
        setSelectedPlatform(platforms[0]);
      }
    }
  }, [content, selectedPlatform]);

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
    });
  };

  const renderPlatformContent = (platform: string, variant: PlatformVariant) => {
    const videoScript = content?.scripts?.[platform.toLowerCase()] || content?.scripts?.[platform];
    const tagsList = variant.tags || variant.hashtags || [];

    return (
      <div className="space-y-5 text-left">
        {/* Title (for YouTube, Reddit, Medium, Blog) */}
        {variant.title && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 shadow-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                SEO Optimized Title
              </span>
              <button
                type="button"
                onClick={() => handleCopy(variant.title!, `${platform}-title`)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === `${platform}-title` ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{copiedSection === `${platform}-title` ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="text-base sm:text-lg font-bold text-white leading-snug">{variant.title}</p>
            {variant.subtitle && (
              <p className="text-xs sm:text-sm text-zinc-400 italic">{variant.subtitle}</p>
            )}
          </div>
        )}

        {/* Standard Post Text (LinkedIn, General) */}
        {variant.postText && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
                Post Text
              </span>
              <button
                type="button"
                onClick={() => handleCopy(variant.postText!, `${platform}-post`)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === `${platform}-post` ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{copiedSection === `${platform}-post` ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <MarkdownRenderer content={variant.postText} />
          </div>
        )}

        {/* Video Description (YouTube) */}
        {variant.description && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
                Video Description
              </span>
              <button
                type="button"
                onClick={() => handleCopy(variant.description!, `${platform}-desc`)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === `${platform}-desc` ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{copiedSection === `${platform}-desc` ? "Copied" : "Copy Description"}</span>
              </button>
            </div>
            <MarkdownRenderer content={variant.description} />
          </div>
        )}

        {/* Reddit Post Body */}
        {variant.postBody && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
                Reddit Discussion Post
              </span>
              <button
                type="button"
                onClick={() => handleCopy(variant.postBody!, `${platform}-reddit`)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === `${platform}-reddit` ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{copiedSection === `${platform}-reddit` ? "Copied" : "Copy Post"}</span>
              </button>
            </div>
            <MarkdownRenderer content={variant.postBody} />
          </div>
        )}

        {/* Medium / Blog Article Body */}
        {variant.body && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
                Article Body
              </span>
              <button
                type="button"
                onClick={() => handleCopy(variant.body!, `${platform}-body`)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === `${platform}-body` ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{copiedSection === `${platform}-body` ? "Copied" : "Copy Article"}</span>
              </button>
            </div>
            <MarkdownRenderer content={variant.body} />
          </div>
        )}

        {/* Twitter Thread */}
        {variant.thread && Array.isArray(variant.thread) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
                Thread ({variant.thread.length} tweets)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(variant.thread!.join("\n\n"), `${platform}-thread-all`)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === `${platform}-thread-all` ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>Copy Entire Thread</span>
              </button>
            </div>
            <div className="space-y-3">
              {variant.thread.map((tweet, index) => (
                <div key={index} className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Tweet {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(tweet, `${platform}-tweet-${index}`)}
                      className="p-1 text-zinc-400 hover:text-zinc-200"
                    >
                      {copiedSection === `${platform}-tweet-${index}` ? (
                        <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <FiCopy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <MarkdownRenderer content={tweet} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instagram Caption */}
        {variant.caption && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
                Instagram Caption
              </span>
              <button
                type="button"
                onClick={() => handleCopy(variant.caption!, `${platform}-caption`)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === `${platform}-caption` ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>Copy Caption</span>
              </button>
            </div>
            <MarkdownRenderer content={variant.caption} />
          </div>
        )}

        {/* YouTube Chapters */}
        {variant.chapters && Array.isArray(variant.chapters) && variant.chapters.length > 0 && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Video Chapters
            </span>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 pt-1">
              {variant.chapters.map((chap: any, i: number) => {
                const time = typeof chap === "object" ? (chap.start || chap.timestamp || chap.time || "") : "";
                const label = typeof chap === "object" ? (chap.label || chap.title || chap.name || chap.text || "") : String(chap || "");
                return (
                  <li key={i} className="flex items-center gap-2.5 py-1 border-b border-zinc-900 last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {time && (
                      <span className="font-mono text-amber-300 font-semibold shrink-0 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {time}
                      </span>
                    )}
                    <span className="text-zinc-200">{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Thumbnail Hook & Shorts Hook */}
        {(variant.thumbnailText || variant.shortHook || variant.coverText) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(variant.thumbnailText || variant.coverText) && (
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {variant.thumbnailText ? "Thumbnail Hook" : "Cover Slide Hook"}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-zinc-100">
                  {typeof variant.thumbnailText === "object" ? JSON.stringify(variant.thumbnailText) : (variant.thumbnailText || variant.coverText)}
                </p>
              </div>
            )}
            {variant.shortHook && (
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Shorts Opening Hook
                </span>
                <p className="text-xs sm:text-sm font-semibold text-zinc-100">
                  {typeof variant.shortHook === "object" ? JSON.stringify(variant.shortHook) : variant.shortHook}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Video Script (if generated for YouTube/TikTok/Instagram) */}
        {videoScript && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800/80">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-400 flex items-center gap-2">
                <FiVideo className="w-4 h-4 text-amber-400" />
                Video / Voiceover Script
              </span>
              <button
                type="button"
                onClick={() => handleCopy(typeof videoScript === "string" ? videoScript : JSON.stringify(videoScript, null, 2), `${platform}-script`)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === `${platform}-script` ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>Copy Script</span>
              </button>
            </div>
            {typeof videoScript === "string" ? (
              <MarkdownRenderer content={videoScript} />
            ) : videoScript.script ? (
              <MarkdownRenderer content={videoScript.script} />
            ) : videoScript.sections && Array.isArray(videoScript.sections) ? (
              <div className="space-y-3 pt-1">
                {videoScript.sections.map((sec: any, idx: number) => {
                  let parsed = sec;
                  if (typeof sec === "string") {
                    const trimmed = sec.trim();
                    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                      try { parsed = JSON.parse(trimmed); } catch { parsed = sec; }
                    }
                  }
                  if (typeof parsed === "object" && parsed !== null) {
                    const timeLabel = parsed.time || parsed.timestamp || parsed.start || parsed.heading || `Section ${idx + 1}`;
                    const typeLabel = parsed.type || parsed.role || parsed.format || "";
                    const textBody = parsed.text || parsed.narration || parsed.content || parsed.body || parsed.script || "";
                    const visualCue = parsed.visuals || parsed.visual || parsed.cue || parsed.visual_cue || "";

                    return (
                      <div key={idx} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                            {timeLabel}
                          </span>
                          {typeLabel && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-300">
                              {typeLabel}
                            </span>
                          )}
                        </div>
                        {textBody && (
                          <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                            <MarkdownRenderer content={textBody} />
                          </div>
                        )}
                        {visualCue && (
                          <div className="pt-2 border-t border-zinc-800/50 text-xs text-zinc-400 italic">
                            <span className="text-zinc-300 font-medium not-italic">Visual cue: </span>
                            {typeof visualCue === "object" ? JSON.stringify(visualCue) : visualCue}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Section {idx + 1}
                      </span>
                      <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                        <MarkdownRenderer content={String(parsed)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <MarkdownRenderer content={videoScript} />
            )}
          </div>
        )}

        {/* Tags, Hashtags, Subreddits */}
        {tagsList.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Keywords & Hashtags
            </span>
            <div className="flex flex-wrap gap-2">
              {tagsList.map((tag: any, index: number) => {
                const tagStr = typeof tag === "object" ? (tag.tag || tag.name || tag.label || JSON.stringify(tag)) : String(tag || "");
                return (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs font-medium text-amber-400"
                  >
                    {tagStr.startsWith("#") ? tagStr : `#${tagStr}`}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Subreddit suggestions */}
        {variant.subredditSuggestions && variant.subredditSuggestions.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Target Subreddits
            </span>
            <div className="flex flex-wrap gap-2">
              {variant.subredditSuggestions.map((sub: any, index: number) => {
                const subStr = typeof sub === "object" ? (sub.name || sub.subreddit || JSON.stringify(sub)) : String(sub || "");
                return (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-[#FF4500]"
                  >
                    r/{subStr.replace(/^r\//, "")}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="p-12 text-center text-zinc-500 text-xs sm:text-sm">
          Loading content studio details...
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !content) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <button
            type="button"
            onClick={() => router.push("/content/library")}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to Library
          </button>
          <div className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20 space-y-2">
            <FiAlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h2 className="text-base font-bold text-zinc-200">Content Not Found</h2>
            <p className="text-xs text-zinc-400">{error || "Requested content does not exist."}</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-[1536px] w-full mx-auto space-y-6 pb-16 px-4 sm:px-8">
        {/* Header */}
        <div className="space-y-3 text-left">
          <button
            type="button"
            onClick={() => router.push("/content/library")}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to Content Library
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FormatBadge format={content.contentType} />
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                  {content.distribution?.status || "draft"}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {safeText(content.outline?.title) || safeText(content.topic)}
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5">
                Target Audience: {content.targetAudience} • Created {formatDate(content.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Grid (Equal Height): 25% Left (Content Blueprint), 75% Right (Distribution Copy) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (25% -> 3/12 cols): Content Blueprint & Key Sections */}
          <div className="lg:col-span-3 text-left flex flex-col">
            {content.outline && (
              <div className="p-5 sm:p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-5 shadow-sm h-full flex flex-col">
                <div className="pb-3 border-b border-zinc-800/80">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    Content Blueprint
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Structure & key anchors</p>
                </div>

                {content.outline.hook && (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Master Hook</span>
                    <MarkdownRenderer content={content.outline.hook} />
                  </div>
                )}

                {content.outline.sections && content.outline.sections.length > 0 && (
                  <div className="space-y-3  flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Key Sections ({content.outline.sections.length})
                    </span>
                    <div className="space-y-3">
                      {content.outline.sections.map((sec, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1.5 shadow-sm">
                          <MarkdownRenderer content={typeof sec === "string" ? sec : safeText(sec)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {content.outline.cta && (
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1 mt-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Call to Action</span>
                    <p className="text-xs text-zinc-300">{content.outline.cta}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (75% -> 9/12 cols): Multi-Platform Copy */}
          <div className="lg:col-span-9 text-left flex flex-col">
            <div className="p-6 sm:p-7 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-6 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Multi-Platform Distribution Copy
                </h2>
                <span className="text-xs font-medium text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/40">
                  Ready to Publish
                </span>
              </div>

              {/* Neutral Platform Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-zinc-800/60">
                {Object.keys(content.platformVariants || {}).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setSelectedPlatform(plat)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all shrink-0 border ${
                      selectedPlatform === plat
                        ? "bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm font-semibold"
                        : "bg-zinc-950/80 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    {getPlatformIcon(plat)}
                    <span>{getPlatformDisplayName(plat)}</span>
                  </button>
                ))}
              </div>

              {/* Platform Variant Content */}
              <div className="flex-1">
                {content.platformVariants?.[selectedPlatform] ? (
                  renderPlatformContent(selectedPlatform, content.platformVariants[selectedPlatform])
                ) : (
                  <div className="p-12 text-center text-xs text-zinc-500">
                    Select a platform variant above to inspect generated copy.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Master Draft (Full 100% Width Below Both Sections) */}
        {content.draft?.text && (
          <div className="w-full p-6 sm:p-7 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4 shadow-sm text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                Master Draft
              </h2>
              <button
                type="button"
                onClick={() => handleCopy(content.draft.text!, "master-draft")}
                className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
              >
                {copiedSection === "master-draft" ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{copiedSection === "master-draft" ? "Copied" : "Copy Draft"}</span>
              </button>
            </div>
            <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800">
              <MarkdownRenderer content={content.draft.text} />
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

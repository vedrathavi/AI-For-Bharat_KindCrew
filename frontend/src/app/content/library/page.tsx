"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { getUserContent, regenerateVariant, updateDistributionStatus } from "@/lib/api/content";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { Badge } from "@/components/ui/Badge";
import {
  getPlatformIcon,
  getPlatformDisplayName,
  PlatformBadge,
  FormatBadge,
} from "@/lib/platformConfig";
import {
  FiArrowLeft,
  FiCopy,
  FiCheck,
  FiPlus,
  FiLayers,
  FiExternalLink,
  FiRefreshCw,
  FiFolder,
  FiTrash2,
  FiEye,
  FiX,
  FiAlertCircle,
  FiShare2,
} from "react-icons/fi";

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
  const { authReady, userInfo, token } = useAuth();
  const authenticated = !!token && !!userInfo;
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [localContentList, setLocalContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [regenerating, setRegenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (authReady && !authenticated) {
      router.replace("/");
    }
  }, [authReady, authenticated, router]);

  useEffect(() => {
    if (authReady && authenticated && userInfo?.userId && token) {
      loadContent();
    }
  }, [authReady, authenticated, userInfo?.userId, token]);

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
        await loadContent();
      }
    } catch (err: any) {
      console.error("Error regenerating variant:", err);
      setError(err.message || "Failed to regenerate variant");
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
      setError(err.message || "Failed to update status");
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
      className="px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/60"
    >
      {copiedKey === copyKey ? <FiCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FiCopy className="w-3.5 h-3.5 text-zinc-400" />}
      <span>{copiedKey === copyKey ? "Copied" : "Copy"}</span>
    </button>
  );

  const renderPlatformVariant = (platform: string, variant: PlatformVariant) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return (
          <div className="space-y-4 text-left">
            {variant.title && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Video Title</span>
                  {copyButton("youtube-title", variant.title)}
                </div>
                <p className="text-xs font-bold text-white">{variant.title}</p>
              </div>
            )}

            {variant.description && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Description</span>
                  {copyButton("youtube-desc", variant.description)}
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <MarkdownRenderer content={variant.description} />
                </div>
              </div>
            )}

            {variant.chapters && Array.isArray(variant.chapters) && variant.chapters.length > 0 && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Chapters</span>
                <ul className="space-y-1 text-xs text-zinc-300">
                  {variant.chapters.map((chap: any, i: number) => {
                    const time = typeof chap === "object" ? (chap.start || chap.timestamp || chap.time || "") : "";
                    const label = typeof chap === "object" ? (chap.label || chap.title || chap.name || chap.text || "") : String(chap || "");
                    return (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {time && <span className="font-mono text-amber-300 font-semibold">{time}</span>}
                        <span className="text-zinc-200">{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {(variant.thumbnailText || variant.shortHook) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {variant.thumbnailText && (
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Thumbnail Text</span>
                    <p className="text-zinc-200 font-semibold">
                      {typeof variant.thumbnailText === "object" ? JSON.stringify(variant.thumbnailText) : variant.thumbnailText}
                    </p>
                  </div>
                )}
                {variant.shortHook && (
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Shorts Hook</span>
                    <p className="text-zinc-200 font-semibold">
                      {typeof variant.shortHook === "object" ? JSON.stringify(variant.shortHook) : variant.shortHook}
                    </p>
                  </div>
                )}
              </div>
            )}

            {Array.isArray(variant.tags) && variant.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {variant.tags.map((tag: any, i: number) => {
                  const tagStr = typeof tag === "object" ? (tag.tag || tag.name || tag.label || JSON.stringify(tag)) : String(tag || "");
                  return (
                    <span key={i} className="text-xs font-medium text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-800/40">
                      {tagStr.startsWith("#") ? tagStr : `#${tagStr}`}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "reddit":
        return (
          <div className="space-y-4 text-left">
            {variant.title && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#FF4500] uppercase">Reddit Title</span>
                  {copyButton("reddit-title", variant.title)}
                </div>
                <p className="text-xs font-bold text-white">{variant.title}</p>
              </div>
            )}

            {variant.postBody && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Discussion Post</span>
                  {copyButton("reddit-post", variant.postBody)}
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <MarkdownRenderer content={variant.postBody} />
                </div>
              </div>
            )}

            {Array.isArray(variant.subredditSuggestions) && variant.subredditSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {variant.subredditSuggestions.map((sub: any, i: number) => {
                  const subStr = typeof sub === "object" ? (sub.name || sub.subreddit || JSON.stringify(sub)) : String(sub || "");
                  return (
                    <span key={i} className="text-xs font-medium text-[#FF4500] bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                      r/{subStr.replace(/^r\//, "")}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "medium":
      case "blog":
        return (
          <div className="space-y-4 text-left">
            {variant.title && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Article Title</span>
                  {copyButton("medium-title", variant.title)}
                </div>
                <p className="text-xs font-bold text-white">{variant.title}</p>
                {variant.subtitle && <p className="text-[11px] text-zinc-400 italic">{variant.subtitle}</p>}
              </div>
            )}

            {(variant.body || variant.postText) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Article Content</span>
                  {copyButton("medium-body", variant.body || variant.postText || "")}
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  <MarkdownRenderer content={variant.body || variant.postText || ""} />
                </div>
              </div>
            )}

            {Array.isArray(variant.tags) && variant.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {variant.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs font-medium text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-800/40">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "linkedin":
        return (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Post Text</span>
                {copyButton("linkedin-post", variant.postText || "")}
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <MarkdownRenderer content={variant.postText || ""} />
              </div>
            </div>
            {Array.isArray(variant.hashtags) && variant.hashtags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {variant.hashtags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs font-medium text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-800/40">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "twitter":
        return (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Thread ({variant.tweetCount || variant.thread?.length || 0} tweets)
              </span>
              {copyButton("twitter-thread", (variant.thread || []).join("\n\n"))}
            </div>
            <div className="space-y-3">
              {variant.thread?.map((tweet: string, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Tweet {index + 1}</span>
                    {copyButton(`twitter-tweet-${index}`, tweet)}
                  </div>
                  <MarkdownRenderer content={tweet} />
                </div>
              ))}
            </div>
          </div>
        );

      case "instagram":
      case "tiktok":
        return (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Caption</span>
                {copyButton("instagram-caption", variant.caption || "")}
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <MarkdownRenderer content={variant.caption || ""} />
              </div>
            </div>
            {variant.coverText && (
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
                <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Cover Slide Hook</span>
                <MarkdownRenderer content={variant.coverText} />
              </div>
            )}
            {Array.isArray(variant.hashtags) && variant.hashtags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {variant.hashtags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs font-medium text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-800/40">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-3 text-left">
            {Object.entries(variant).map(([key, value]) => {
              if (key === "platform") return null;
              const text = Array.isArray(value) ? value.join("\n") : String(value ?? "");
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400 capitalize">{key}</span>
                    {copyButton(`default-${key}`, text)}
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                    <MarkdownRenderer content={text} />
                  </div>
                </div>
              );
            })}
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "scheduled":
        return <Badge variant="warning">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Stage 2 — Content Studio Vault
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Content Library
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage your generated multi-platform drafts, review distribution readiness, and inspect variant scripts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/content/create")}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create New Content</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content List Grid */}
        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs sm:text-sm">
            Loading your content studio vault...
          </div>
        ) : contentList.length === 0 && localContentList.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20 space-y-4">
            <FiFolder className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">Your content library is empty</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Generate full multi-platform drafts from your approved ideas or create custom content from scratch.
            </p>
            <button
              type="button"
              onClick={() => router.push("/content/create")}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>Launch Content Studio</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentList.map((content) => {
              const platforms = Object.keys(content.platformVariants || {});
              return (
                <div
                  key={content.contentId}
                  className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px]">
                          {content.source === "phase1" ? "From Ideation" : "Custom Draft"}
                        </Badge>
                        <FormatBadge format={content.contentType} />
                      </div>
                      {getStatusBadge(content.distribution?.status)}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
                      {content.topic}
                    </h3>

                    {content.draft?.text && (
                      <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 line-clamp-3">
                        <MarkdownRenderer content={content.draft.text} />
                      </div>
                    )}

                    {platforms.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-zinc-500 font-medium mr-1">Platforms:</span>
                        {platforms.map((plat) => (
                          <PlatformBadge key={plat} platform={plat} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContent(content);
                        setSelectedPlatform(platforms[0] || "linkedin");
                      }}
                      className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      <span>Inspect Drafts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/content/${content.contentId}`)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>Full Studio</span>
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Draft Inspection Modal */}
        {selectedContent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-2xl w-full max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-4">
                  <h2 className="text-base font-bold text-zinc-100 truncate">
                    {selectedContent.topic}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Target: {selectedContent.targetAudience} • {selectedContent.contentType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContent(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Platform Selector Tabs */}
              <div className="px-5 pt-3 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {Object.keys(selectedContent.platformVariants || {}).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setSelectedPlatform(plat)}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                      selectedPlatform === plat
                        ? "border-zinc-200 text-zinc-100 bg-zinc-900"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {getPlatformIcon(plat)}
                    <span>{getPlatformDisplayName(plat)}</span>
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                {selectedContent.platformVariants?.[selectedPlatform] ? (
                  renderPlatformVariant(selectedPlatform, selectedContent.platformVariants[selectedPlatform])
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    No variant available for {selectedPlatform}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleRegenerateVariant(selectedContent.contentId, selectedPlatform)}
                  disabled={regenerating}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-zinc-800 disabled:opacity-50"
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                  <span>{regenerating ? "Regenerating..." : "Regenerate Variant"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedContent(null)}
                  className="px-4 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

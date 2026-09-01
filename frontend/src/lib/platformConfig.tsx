"use client";

import React from "react";
import {
  FaLinkedin,
  FaXTwitter,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaReddit,
  FaMedium,
  FaFacebook,
  FaGlobe,
} from "react-icons/fa6";
import { FiFileText, FiVideo, FiLayers, FiMessageSquare } from "react-icons/fi";

export type PlatformKey =
  | "youtube"
  | "linkedin"
  | "twitter"
  | "instagram"
  | "reddit"
  | "medium"
  | "tiktok"
  | "facebook"
  | "blog"
  | "general";

/**
 * Normalizes platform strings to a standard lowercase identifier.
 */
export function normalizePlatform(platform: string = ""): PlatformKey {
  const p = platform.trim().toLowerCase();
  if (p.includes("youtube") || p === "yt") return "youtube";
  if (p.includes("linkedin")) return "linkedin";
  if (p.includes("twitter") || p === "x" || p.includes("x/twitter") || p.includes("twitter/x")) return "twitter";
  if (p.includes("instagram") || p === "ig") return "instagram";
  if (p.includes("reddit")) return "reddit";
  if (p.includes("medium")) return "medium";
  if (p.includes("tiktok")) return "tiktok";
  if (p.includes("facebook") || p === "fb") return "facebook";
  if (p.includes("blog") || p.includes("article")) return "medium";
  return "general";
}

/**
 * Single source of truth for canonical platform display names.
 */
export function getPlatformDisplayName(platform: string = ""): string {
  const key = normalizePlatform(platform);
  switch (key) {
    case "youtube":
      return "YouTube";
    case "linkedin":
      return "LinkedIn";
    case "twitter":
      return "Twitter/X";
    case "instagram":
      return "Instagram";
    case "reddit":
      return "Reddit";
    case "medium":
      return "Medium";
    case "tiktok":
      return "TikTok";
    case "facebook":
      return "Facebook";
    default:
      return platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "General";
  }
}

/**
 * Single source of truth for canonical platform icons.
 */
export function getPlatformIcon(platform: string = "", className: string = "w-3.5 h-3.5"): React.ReactNode {
  const key = normalizePlatform(platform);
  switch (key) {
    case "youtube":
      return <FaYoutube className={`${className} text-[#FF0000] shrink-0`} />;
    case "linkedin":
      return <FaLinkedin className={`${className} text-[#0A66C2] shrink-0`} />;
    case "twitter":
      return <FaXTwitter className={`${className} text-zinc-100 shrink-0`} />;
    case "instagram":
      return <FaInstagram className={`${className} text-[#E4405F] shrink-0`} />;
    case "reddit":
      return <FaReddit className={`${className} text-[#FF4500] shrink-0`} />;
    case "medium":
      return <FaMedium className={`${className} text-zinc-100 shrink-0`} />;
    case "tiktok":
      return <FaTiktok className={`${className} text-[#00F2FE] shrink-0`} />;
    case "facebook":
      return <FaFacebook className={`${className} text-[#1877F2] shrink-0`} />;
    default:
      return <FaGlobe className={`${className} text-amber-400 shrink-0`} />;
  }
}

/**
 * Canonical Format Display Names
 */
export function getFormatDisplayName(format: string = ""): string {
  const f = format.trim().toLowerCase();
  if (f.includes("video") || f.includes("script")) return "Video Script";
  if (f.includes("thread")) return "Thread";
  if (f.includes("carousel")) return "Carousel";
  if (f.includes("article") || f.includes("blog")) return "Article";
  if (f.includes("short") || f.includes("reel")) return "Short / Reel";
  if (f.includes("post")) return "Post";
  return format ? format.charAt(0).toUpperCase() + format.slice(1) : "Post";
}

/**
 * Canonical Format Icons
 */
export function getFormatIcon(format: string = "", className: string = "w-3 h-3"): React.ReactNode {
  const f = format.trim().toLowerCase();
  if (f.includes("video") || f.includes("script")) return <FiVideo className={`${className} text-amber-400 shrink-0`} />;
  if (f.includes("thread")) return <FiMessageSquare className={`${className} text-zinc-300 shrink-0`} />;
  if (f.includes("carousel")) return <FiLayers className={`${className} text-emerald-400 shrink-0`} />;
  return <FiFileText className={`${className} text-zinc-400 shrink-0`} />;
}

/**
 * Reusable Unified Platform Badge Component
 */
export function PlatformBadge({
  platform,
  className = "",
  showIcon = true,
}: {
  platform: string;
  className?: string;
  showIcon?: boolean;
}) {
  const displayName = getPlatformDisplayName(platform);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-zinc-950 border border-zinc-800 text-zinc-200 shadow-sm ${className}`}
    >
      {showIcon && getPlatformIcon(platform)}
      <span>{displayName}</span>
    </span>
  );
}

/**
 * Reusable Unified Format Badge Component
 */
export function FormatBadge({
  format,
  className = "",
  showIcon = true,
}: {
  format: string;
  className?: string;
  showIcon?: boolean;
}) {
  const displayName = getFormatDisplayName(format);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 ${className}`}
    >
      {showIcon && getFormatIcon(format)}
      <span>{displayName}</span>
    </span>
  );
}

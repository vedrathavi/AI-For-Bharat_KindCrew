"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: any;
  className?: string;
}

/**
 * Parses and formats any text, JSON string, or structured object into clean human-readable Markdown.
 */
export function formatStructuredContent(val: any): string {
  if (val == null) return "";

  let obj = val;

  // Handle strings that might be JSON
  if (typeof val === "string") {
    const trimmed = val.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        obj = JSON.parse(trimmed);
      } catch {
        return val;
      }
    } else {
      return val;
    }
  }

  if (typeof obj !== "object") return String(obj);

  // Array of items
  if (Array.isArray(obj)) {
    return obj
      .map((item) => (typeof item === "object" ? formatStructuredContent(item) : `• ${item}`))
      .join("\n");
  }

  // Object structure
  const parts: string[] = [];

  // Title / Heading
  const title = obj.title || obj.heading || obj.sectionTitle || obj.name;
  if (title) {
    parts.push(`**${title}**`);
  }

  // Main Content / Points / Details / Text
  const mainContent =
    obj.content || obj.points || obj.details || obj.description || obj.text || obj.keyPoints || obj.body;
  if (mainContent) {
    if (Array.isArray(mainContent)) {
      parts.push(
        mainContent
          .map((item: any) => (typeof item === "object" ? formatStructuredContent(item) : `• ${item}`))
          .join("\n")
      );
    } else if (typeof mainContent === "object") {
      parts.push(formatStructuredContent(mainContent));
    } else {
      parts.push(String(mainContent));
    }
  }

  // Visual Suggestions / Cues
  const visuals = obj.visuals || obj.visuals_cue || obj.visualCue || obj.visualSuggestions;
  if (visuals) {
    const visualsStr = typeof visuals === "object" ? JSON.stringify(visuals) : String(visuals);
    parts.push(`*Visual Suggestions:* ${visualsStr}`);
  }

  // Notes / Takeaway
  const note = obj.notes || obj.takeaway || obj.visualNotes;
  if (note && note !== mainContent) {
    parts.push(`*Note:* ${typeof note === "object" ? JSON.stringify(note) : String(note)}`);
  }

  // Fallback for objects with other key/value pairs
  if (parts.length === 0) {
    for (const [key, v] of Object.entries(obj)) {
      const formattedKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());

      if (Array.isArray(v)) {
        parts.push(`**${formattedKey}:**\n${v.map((item) => `• ${item}`).join("\n")}`);
      } else if (typeof v === "object" && v !== null) {
        parts.push(`**${formattedKey}:**\n${formatStructuredContent(v)}`);
      } else {
        parts.push(`**${formattedKey}:** ${v}`);
      }
    }
  }

  return parts.join("\n\n");
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (content == null) return null;

  const formattedText = formatStructuredContent(content);
  if (!formattedText) return null;

  return (
    <div className={`prose-dark text-xs sm:text-sm text-zinc-300 leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-zinc-300">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
          em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-300">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold text-zinc-100 mt-3 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-zinc-100 mt-2.5 mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-zinc-200 mt-2 mb-1">{children}</h3>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-amber-300 text-xs font-mono">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-amber-500/70 pl-3 my-2 italic text-zinc-400 bg-zinc-900/30 py-1 rounded-r">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {formattedText}
      </ReactMarkdown>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Keyword } from "@/types/research";
import { FiHelpCircle } from "react-icons/fi";

interface KeywordChipProps {
  keyword: Keyword | string;
}

export function KeywordChip({ keyword }: KeywordChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const term = typeof keyword === "string" ? keyword : keyword.term;
  const importance = typeof keyword === "string" ? "medium" : keyword.importance || "medium";
  const definition =
    typeof keyword === "string"
      ? `Market search keyword focused on ${keyword}.`
      : keyword.definition || `High-interest thematic keyword: ${term}.`;
  const whyItMatters =
    typeof keyword === "string"
      ? `High search relevance and discovery anchor for this topic.`
      : keyword.whyItMatters || `Increases algorithmic resonance and search discovery for this audience.`;

  const badgeColor =
    importance === "high"
      ? "bg-zinc-900 text-zinc-100 border-zinc-700 hover:border-zinc-500"
      : "bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:border-zinc-600";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${badgeColor}`}
      >
        <span>{term}</span>
        <FiHelpCircle className="w-3 h-3 text-zinc-400 opacity-60 hover:opacity-100 shrink-0" />
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-[80vw] sm:max-w-xs p-3 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-2xl text-left z-50 text-xs space-y-1.5 pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-100">{term}</span>
            <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">
              {importance} Priority
            </span>
          </div>
          <p className="text-zinc-300 text-[11px] leading-relaxed">
            {definition}
          </p>
          <div className="pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400">
            <span className="text-zinc-200 font-semibold">Why it matters: </span>
            {whyItMatters}
          </div>
        </div>
      )}
    </div>
  );
}

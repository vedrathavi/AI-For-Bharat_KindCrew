"use client";

import { FiShield, FiAlertTriangle } from "react-icons/fi";

interface ResearchConfidenceBadgeProps {
  confidence?: number;
}

export function ResearchConfidenceBadge({ confidence = 0.5 }: ResearchConfidenceBadgeProps) {
  const isHigh = confidence >= 0.7;
  const isMedium = confidence >= 0.4 && confidence < 0.7;

  const color = isHigh
    ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
    : isMedium
    ? "bg-amber-950/60 text-amber-300 border-amber-800/60"
    : "bg-zinc-950/60 text-zinc-400 border-zinc-800";

  const label = isHigh
    ? "High Evidence Confidence"
    : isMedium
    ? "Medium Research Confidence"
    : "Baseline Market Signals";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${color}`}
      title={`Research confidence rating: ${(confidence * 100).toFixed(0)}%`}
    >
      {isHigh ? (
        <FiShield className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <FiAlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
      )}
      <span>{label} ({(confidence * 100).toFixed(0)}%)</span>
    </span>
  );
}

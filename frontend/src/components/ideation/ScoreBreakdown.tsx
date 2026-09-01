"use client";

import { useState } from "react";
import { IdeaScore } from "@/types/research";
import { getHumanDimensionExplanation } from "@/lib/scoring/scoreInterpreter";
import { FiChevronDown, FiChevronUp, FiSliders } from "react-icons/fi";

interface ScoreBreakdownProps {
  scores?: IdeaScore | any;
}

const DIMENSION_TITLES: Record<string, string> = {
  audienceDemand: "Audience Demand",
  trendMomentum: "Trend Momentum",
  creatorFit: "Creator Fit",
  contentGap: "Content Gap Opportunity",
  differentiation: "Differentiation Strength",
  novelty: "Novelty vs Prior Ideas",
  competition: "Low Competition Edge",
  platformFit: "Platform Format Match",
  feasibility: "Execution Feasibility",
  evidenceStrength: "Evidence Strength",
};

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!scores || !scores.dimensions || typeof scores.dimensions !== "object") {
    return null;
  }

  const dimensions = Object.entries(scores.dimensions) as [
    string,
    { score: number; explanation: string }
  ][];

  if (dimensions.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors text-xs font-semibold text-zinc-300"
      >
        <div className="flex items-center gap-2">
          <FiSliders className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Why we scored it this way (Diagnostic breakdown)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
            {dimensions.length} Signals Analyzed
          </span>
          {isOpen ? (
            <FiChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <FiChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-zinc-800/80 space-y-2.5 bg-zinc-950/90 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {dimensions.map(([key, dim]) => {
              const scoreNum = typeof dim.score === "number" ? dim.score : 7.0;
              const humanText = getHumanDimensionExplanation(
                key,
                scoreNum,
                dim.explanation
              );

              return (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-200">
                      {DIMENSION_TITLES[key] || key}
                    </span>
                    <span className="font-bold text-amber-400 font-mono">
                      {scoreNum.toFixed(1)} / 10
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {humanText}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

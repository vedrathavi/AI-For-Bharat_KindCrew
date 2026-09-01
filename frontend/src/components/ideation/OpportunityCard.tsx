"use client";

import { useState } from "react";
import { CandidateOpportunity, ResearchSnapshot, VerifiedSource, Keyword } from "@/types/research";
import { interpretScore } from "@/lib/scoring/scoreInterpreter";
import { KeywordChip } from "./KeywordChip";
import { SourceCard } from "./SourceCard";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { PlatformBadge, FormatBadge } from "@/lib/platformConfig";
import { Badge } from "@/components/ui/Badge";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiTarget,
  FiZap,
} from "react-icons/fi";

interface OpportunityCardProps {
  opportunity: CandidateOpportunity;
  snapshot?: ResearchSnapshot | null;
  onSelect: (opportunity: CandidateOpportunity) => void;
  isPrimary?: boolean;
}

export function OpportunityCard({
  opportunity,
  snapshot,
  onSelect,
  isPrimary = false,
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreData = opportunity.scores || {
    overall: 8.0,
    opportunityScore: 8.0,
    researchConfidence: snapshot?.researchConfidence || 0.5,
  };

  const interpretation = interpretScore(scoreData);
  const painPoints = snapshot?.corpus?.audiencePainPoints || [];
  const contentGaps = snapshot?.corpus?.contentGaps || [];
  const verifiedSources = snapshot?.verifiedSources || [];

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 text-left space-y-4 ${
        isPrimary
          ? "border-amber-500/40 bg-zinc-900/80 shadow-2xl p-6 sm:p-7"
          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 p-5 sm:p-6"
      }`}
    >
      {/* Top Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={opportunity.platform} />
          <FormatBadge format={opportunity.format || "post"} />
          {isPrimary && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
              Top Opportunity
            </span>
          )}
        </div>

        {/* Score & Human Interpretation Label */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${interpretation.badgeColor}`}
          >
            {interpretation.label}
          </span>
          <span className="text-base font-extrabold text-white font-mono">
            {(scoreData.opportunityScore ?? scoreData.overall ?? 7.5).toFixed(1)} / 10
          </span>
        </div>
      </div>

      {/* Main Title & Angle */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-2">
          {opportunity.title}
        </h3>

        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
          <div className="text-xs text-zinc-300">
            <span className="font-semibold text-zinc-400">Angle: </span>
            <MarkdownRenderer content={opportunity.angle} className="inline" />
          </div>

          {opportunity.hook && (
            <div className="pt-2 border-t border-zinc-800/60 flex items-start gap-2 text-xs">
              <FiTarget className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-zinc-200 flex-1">
                <span className="font-semibold text-amber-400">Hook: </span>
                <MarkdownRenderer content={opportunity.hook} className="inline" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score Interpretation Block (Why this works & Watch out for) */}
      <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/70 space-y-2.5 text-xs">
        <p className="text-zinc-300 font-medium leading-relaxed">
          {interpretation.summary}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-400">
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span>Why this works</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-normal">
              {interpretation.whyItWorks}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-400">
              <FiAlertCircle className="w-3.5 h-3.5" />
              <span>Watch out for</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-normal">
              {interpretation.watchOutFor}
            </p>
          </div>
        </div>
      </div>

      {/* Keywords Chips */}
      {opportunity.targetedKeywords && opportunity.targetedKeywords.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Targeted Keywords (Hover for definitions)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {opportunity.targetedKeywords.map((kw: string | Keyword, idx: number) => {
              // Try to find matching rich Keyword object from corpus
              const corpusKeywords = snapshot?.corpus?.keywords || [];
              const termStr = typeof kw === "string" ? kw : kw.term;
              const matchedObj = corpusKeywords.find(
                (k) => k.term.toLowerCase() === termStr.toLowerCase()
              );
              const resolvedKw = matchedObj || kw;

              return <KeywordChip key={idx} keyword={resolvedKw} />;
            })}
          </div>
        </div>
      )}

      {/* Select Action Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => onSelect(opportunity)}
          className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-bold transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-sm flex items-center justify-center gap-2"
        >
          <span>Select Concept & Save Brief</span>
          <FiArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full sm:w-auto px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{expanded ? "Hide Evidence" : "Inspect Research Evidence"}</span>
          {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Section: Diagnostics, Pain Points, Content Gaps, Verified Sources */}
      {expanded && (
        <div className="pt-4 border-t border-zinc-800 space-y-4 animate-in fade-in duration-200">
          <ScoreBreakdown scores={scoreData} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <h4 className="font-bold text-zinc-200 flex items-center gap-1.5">
                <FiAlertCircle className="w-3.5 h-3.5 text-rose-400" />
                Target Audience Problem
              </h4>
              {opportunity.targetPainPoint ? (
                <p className="text-zinc-300 text-[11px] font-medium leading-relaxed">
                  {opportunity.targetPainPoint}
                </p>
              ) : painPoints.length > 0 ? (
                <ul className="space-y-1.5 text-zinc-400 text-[11px] list-disc list-inside">
                  {painPoints.slice(0, 3).map((p: any, idx) => (
                    <li key={idx}>{typeof p === "string" ? p : p.point}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-[11px]">No specific pain point recorded.</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <h4 className="font-bold text-zinc-200 flex items-center gap-1.5">
                <FiZap className="w-3.5 h-3.5 text-amber-400" />
                Unfilled Content Gap
              </h4>
              {opportunity.contentGap ? (
                <p className="text-zinc-300 text-[11px] font-medium leading-relaxed">
                  {opportunity.contentGap}
                </p>
              ) : contentGaps.length > 0 ? (
                <ul className="space-y-1.5 text-zinc-400 text-[11px] list-disc list-inside">
                  {contentGaps.slice(0, 3).map((g: any, idx) => (
                    <li key={idx}>{typeof g === "string" ? g : g.description}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-[11px]">Standard market coverage.</p>
              )}
            </div>
          </div>

          {verifiedSources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-300">
                Verified Market Sources ({verifiedSources.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {verifiedSources.slice(0, 4).map((src: VerifiedSource, idx) => (
                  <SourceCard key={idx} source={src} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { VerifiedSource } from "@/types/research";
import { FiExternalLink, FiGlobe } from "react-icons/fi";

interface SourceCardProps {
  source: VerifiedSource;
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-1.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold truncate">
          <FiGlobe className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{source.domain}</span>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white transition-colors shrink-0 p-1"
          title="Open source link"
        >
          <FiExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">
        {source.title}
      </h4>

      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
        {source.snippet}
      </p>
    </div>
  );
}

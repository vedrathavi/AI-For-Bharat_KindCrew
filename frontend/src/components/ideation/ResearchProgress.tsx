"use client";

import { useEffect, useState } from "react";
import { FiCompass } from "react-icons/fi";

const STATUS_MESSAGES = [
  "Understanding your creator profile & content pillars…",
  "Finding what audience members are actively discussing…",
  "Searching current market demand and verified web signals…",
  "Analyzing competitor coverage to spot underserved gaps…",
  "Testing candidate angles against your profile and past content…",
  "Synthesizing high-signal, evidence-backed opportunities…",
  "Almost ready with your personalized opportunity shortlist…",
];

export function ResearchProgress() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        setFade(true);
      }, 250);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-10 px-6 sm:px-10 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md max-w-lg mx-auto shadow-2xl space-y-5 text-center">
      <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner">
        <FiCompass className="w-6 h-6 text-amber-400 animate-spin-slow" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      </div>

      <div className="space-y-1.5 min-h-[48px] flex flex-col justify-center">
        <p
          className={`text-sm font-semibold text-zinc-100 transition-opacity duration-300 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {STATUS_MESSAGES[index]}
        </p>
        <p className="text-xs text-zinc-400">
          KindCrew AI is analyzing live market signals and evidence.
        </p>
      </div>

      <div className="w-36 h-1.5 mx-auto rounded-full bg-zinc-900 border border-zinc-800/80 overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full animate-slide-progress w-1/2" />
      </div>
    </div>
  );
}

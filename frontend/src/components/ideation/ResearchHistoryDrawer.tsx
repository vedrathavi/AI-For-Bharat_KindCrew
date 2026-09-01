"use client";

import { useState, useEffect } from "react";
import { ResearchSnapshot } from "@/types/research";
import { getUserResearchHistory } from "@/lib/api/research";
import { FiClock, FiX, FiExternalLink } from "react-icons/fi";

interface ResearchHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onSelectSnapshot: (snapshot: ResearchSnapshot) => void;
}

export function ResearchHistoryDrawer({
  isOpen,
  onClose,
  token,
  onSelectSnapshot,
}: ResearchHistoryDrawerProps) {
  const [history, setHistory] = useState<ResearchSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      getUserResearchHistory(token)
        .then((res) => {
          if (res.success && Array.isArray(res.history)) {
            setHistory(res.history);
          }
        })
        .catch((err) => console.warn("Failed to load history:", err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col space-y-4 text-left shadow-2xl h-full overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Past Research Sessions</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Loading research history...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-400">No past sessions found</p>
            <p>Conduct a research pass to save snapshots here.</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {history.map((snap) => (
              <button
                key={snap.snapshotId}
                type="button"
                onClick={() => {
                  onSelectSnapshot(snap);
                  onClose();
                }}
                className="w-full p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left space-y-2 group"
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-mono text-amber-400">V{snap.version || 1}</span>
                  <span>{new Date(snap.researchGeneratedAt).toLocaleDateString()}</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                  {snap.topic}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                  <span>{snap.audience} • {snap.platform}</span>
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold group-hover:underline">
                    Reopen <FiExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

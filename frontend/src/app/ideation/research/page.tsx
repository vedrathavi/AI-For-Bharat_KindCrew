"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { selectIdea, IdeaBrief } from "@/lib/api/ideation";
import { refreshResearch as refreshResearchApi } from "@/lib/api/research";
import { ResearchSnapshot, CandidateOpportunity } from "@/types/research";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";
import { OpportunityCard } from "@/components/ideation/OpportunityCard";
import { ResearchConfidenceBadge } from "@/components/ideation/ResearchConfidenceBadge";
import { ResearchProgress } from "@/components/ideation/ResearchProgress";
import { ResearchHistoryDrawer } from "@/components/ideation/ResearchHistoryDrawer";
import { ResearchToast, ToastMessage } from "@/components/ui/ResearchToast";
import { Badge } from "@/components/ui/Badge";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  FiArrowLeft,
  FiClock,
  FiCompass,
  FiRefreshCw,
  FiSearch,
  FiTarget,
} from "react-icons/fi";

type SelectedIdea = Pick<
  IdeaBrief,
  | "topic"
  | "angle"
  | "platform"
  | "contentType"
  | "targetAudience"
  | "hookIdea"
  | "scores"
  | "researchSnapshotId"
  | "requestHash"
>;

function normalizeSelectedIdea(raw: unknown): SelectedIdea {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    topic: String(data.topic || data.title || "").trim(),
    angle: String(data.angle || "General strategic angle").trim(),
    platform: String(data.platform || "linkedin").trim(),
    contentType: String(data.contentType || data.format || "post").trim(),
    targetAudience: String(
      data.targetAudience || data.audience || "General audience"
    ).trim(),
    hookIdea: String(data.hookIdea || data.hook || "").trim(),
    researchSnapshotId: data.researchSnapshotId
      ? String(data.researchSnapshotId)
      : undefined,
    requestHash: data.requestHash ? String(data.requestHash) : undefined,
    scores: (data.scores as any) || { overall: 8.0 },
  };
}

export default function ResearchPage() {
  const router = useRouter();
  const { userInfo, token } = useAuth();
  const runResearchAction = useAppStore((state) => state.runResearch);

  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<ResearchSnapshot | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<SelectedIdea | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const storedIdea = sessionStorage.getItem("selectedIdea");
    if (!storedIdea) {
      router.push("/ideation");
      return;
    }
    try {
      const parsed = JSON.parse(storedIdea);
      setSelectedIdea(normalizeSelectedIdea(parsed));
    } catch {
      router.push("/ideation");
    }
  }, [router]);

  const handleResearch = async (forceRefresh = false) => {
    if (!selectedIdea || !userInfo?.userId || !token) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Session Error",
        message: "Your session is not ready. Please refresh and try again.",
      });
      return;
    }

    setLoading(true);

    try {
      if (forceRefresh && snapshot?.snapshotId) {
        const result = await refreshResearchApi(token, snapshot.snapshotId);
        if (result.success && result.research) {
          setSnapshot(result.research);
          setToast({
            id: Date.now().toString(),
            type: "success",
            title: "Research Updated",
            message: `Snapshot V${result.research.version} created with fresh evidence signals.`,
          });
        } else {
          setToast({
            id: Date.now().toString(),
            type: "error",
            title: "Refresh Failed",
            message: result.error || "Could not update research right now.",
          });
        }
      } else {
        const resSnapshot = await runResearchAction(
          selectedIdea.topic,
          selectedIdea.targetAudience,
          forceRefresh,
          false,
          selectedIdea.platform
        );
        if (resSnapshot) {
          setSnapshot(resSnapshot);
        } else {
          setToast({
            id: Date.now().toString(),
            type: "error",
            title: "Research Unavailable",
            message: "Unable to synthesize research. Please try again.",
          });
        }
      }
    } catch (err: unknown) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Research Error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOpportunity = async (op: CandidateOpportunity) => {
    if (!selectedIdea || !userInfo?.userId || !token) return;
    setLoading(true);

    try {
      const payload: Partial<IdeaBrief> = {
        topic: op.title || selectedIdea.topic,
        angle: op.angle || selectedIdea.angle,
        platform: selectedIdea.platform || op.platform || "general",
        contentType: op.format || selectedIdea.contentType,
        targetAudience: selectedIdea.targetAudience,
        hookIdea: op.hook || selectedIdea.hookIdea || undefined,
        scores: (op.scores as any) || selectedIdea.scores,
        researchSnapshotId: snapshot?.snapshotId || selectedIdea.researchSnapshotId,
        requestHash: snapshot?.requestHash || selectedIdea.requestHash,
      };

      const selectResult = await selectIdea(token, payload);
      if (!selectResult.success) {
        setToast({
          id: Date.now().toString(),
          type: "error",
          title: "Save Failed",
          message: selectResult.error || "Failed to save selected idea brief.",
        });
        setLoading(false);
        return;
      }

      sessionStorage.setItem("ideaId", selectResult.ideaId || "");
      sessionStorage.setItem("selectedIdea", JSON.stringify(payload));
      router.push("/ideation/success");
    } catch (err: unknown) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Save Error",
        message: err instanceof Error ? err.message : "Failed to save selected idea",
      });
      setLoading(false);
    }
  };

  if (!selectedIdea) {
    return (
      <AuthenticatedLayout>
        <div className="p-12 text-center text-zinc-500 text-xs">
          Loading concept context...
        </div>
      </AuthenticatedLayout>
    );
  }

  const opportunities = [...(snapshot?.opportunities || [])].sort((a, b) => {
    const scoreA = Number(a.scores?.opportunityScore ?? a.scores?.overall ?? 0);
    const scoreB = Number(b.scores?.opportunityScore ?? b.scores?.overall ?? 0);
    return scoreB - scoreA;
  });

  return (
    <AuthenticatedLayout>
      {/* Toast Notification Container */}
      <ResearchToast toast={toast} onDismiss={() => setToast(null)} />

      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1.5 text-left">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              Back to Strategic Angles
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Stage 1 — Evidence-Backed Research
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Concept Opportunities & Research
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-all shrink-0 self-start sm:self-auto"
          >
            <FiClock className="w-4 h-4 text-amber-400" />
            <span>Continue Previous Research</span>
          </button>
        </div>

        {/* Past Research Sessions Drawer */}
        <ResearchHistoryDrawer
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          token={token}
          onSelectSnapshot={(selectedSnap) => {
            setSnapshot(selectedSnap);
            setToast({
              id: Date.now().toString(),
              type: "info",
              title: "Session Loaded",
              message: `Reopened research session V${selectedSnap.version || 1} for "${selectedSnap.topic}".`,
            });
          }}
        />

        {/* Selected Concept Overview Header Card */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">
                {selectedIdea.platform}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {selectedIdea.contentType}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {selectedIdea.targetAudience}
              </Badge>
            </div>
            {snapshot?.version && (
              <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                Snapshot V{snapshot.version}
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <h2 className="text-base font-bold text-zinc-100">
              {selectedIdea.topic}
            </h2>
            {selectedIdea.hookIdea && (
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 flex items-start gap-2.5">
                <FiTarget className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 flex-1">
                  <span className="font-semibold text-amber-400">Hook: </span>
                  <MarkdownRenderer content={selectedIdea.hookIdea} className="inline" />
                </div>
              </div>
            )}
          </div>

          {!snapshot && !loading && (
            <button
              type="button"
              onClick={() => handleResearch(false)}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-bold transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-sm flex items-center justify-center gap-2"
            >
              <FiSearch className="w-4 h-4" />
              <span>Synthesize Market Research & Opportunities</span>
            </button>
          )}
        </div>

        {/* Loading Progress State */}
        {loading && <ResearchProgress />}

        {/* Research Results View */}
        {snapshot && !loading && (
          <div className="space-y-6 text-left">
            {/* Control Bar: Refresh & Explore More Angles */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <div className="text-zinc-400">
                <span>Snapshot V{snapshot.version} • Created {new Date(snapshot.researchGeneratedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResearch(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 font-semibold transition-all"
                >
                  <FiCompass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Explore More Angles</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResearch(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-800/50 bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 font-semibold transition-all"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Research (V{snapshot.version + 1})</span>
                </button>
              </div>
            </div>

            {/* List of Scored Opportunity Cards */}
            <div className="space-y-6">
              {opportunities.length > 0 ? (
                opportunities.map((op, idx) => (
                  <OpportunityCard
                    key={idx}
                    opportunity={op}
                    snapshot={snapshot}
                    onSelect={handleSelectOpportunity}
                    isPrimary={idx === 0}
                  />
                ))
              ) : (
                <div className="p-12 text-center text-zinc-500 text-xs rounded-2xl border border-zinc-800 bg-zinc-950">
                  No candidate opportunities found in snapshot.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

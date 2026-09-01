"use client";

import { useEffect } from "react";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

interface ResearchToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ResearchToast({ toast, onDismiss }: ResearchToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div className="fixed top-5 right-5 sm:right-8 z-[100] max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 text-left ${
          isError
            ? "bg-zinc-950/95 border-rose-800/80 text-rose-200 shadow-rose-950/20"
            : "bg-zinc-950/95 border-emerald-800/80 text-emerald-200 shadow-emerald-950/20"
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isError ? (
            <FiAlertCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <FiCheckCircle className="w-5 h-5 text-emerald-400" />
          )}
        </div>

        <div className="flex-1 space-y-0.5">
          <h4 className="text-xs font-bold tracking-tight text-white">
            {toast.title}
          </h4>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 text-zinc-400 hover:text-white rounded-lg transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

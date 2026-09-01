"use client";

import React from "react";
import { FiArrowRight, FiCreditCard, FiShield, FiZap } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

interface FinalCTAProps {
  onLogin: () => void;
  loading: boolean;
}

export function FinalCTA({ onLogin, loading }: FinalCTAProps) {
  return (
    <section className="py-28 sm:py-36 relative text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 mx-auto shadow-md">
          <FaHeart className="w-5 h-5 text-amber-400" />
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Build a content system that scales with your growth.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Join forward-thinking creators using KindCrew to research, draft, and publish with verified authority.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onLogin}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-semibold transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Connecting..." : "Launch Creator Studio Free"}</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 pt-4">
          <span className="flex items-center gap-1.5">
            <FiShield className="w-3.5 h-3.5 text-amber-400" />
            Enterprise-Grade Cognito Security
          </span>
          <span className="flex items-center gap-1.5">
            <FiZap className="w-3.5 h-3.5 text-amber-400" />
            Instant Google & Password Linking
          </span>
          <span className="flex items-center gap-1.5">
            <FiCreditCard className="w-3.5 h-3.5 text-amber-400" />
            Zero Credit Card Required
          </span>
        </div>
      </div>
    </section>
  );
}

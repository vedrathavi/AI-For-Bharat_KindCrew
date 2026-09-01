"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

interface NavbarProps {
  authenticated: boolean;
  onLogin: () => void;
  loading: boolean;
}

export function Navbar({ authenticated, onLogin, loading }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-md border-b border-zinc-800/80 py-3.5 shadow-xl shadow-black/40"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 group-hover:scale-105 group-hover:border-zinc-700 transition-all shadow-sm">
            <FaHeart className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
            KindCrew
          </span>
        </Link>

        {/* Single Unified CTA Action */}
        <div className="flex items-center gap-3">
          {authenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs sm:text-sm font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap shrink-0"
            >
              <span>Open Studio</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs sm:text-sm font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <span>{loading ? "Connecting..." : "Start Creating Free"}</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

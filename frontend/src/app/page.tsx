"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { buildApiUrl } from "@/lib/constants";
import { FaHeart, FaGithub } from "react-icons/fa";
import {
  FiZap,
  FiShield,
  FiTrendingUp,
  FiEdit,
  FiCalendar,
  FiBarChart,
} from "react-icons/fi";

export default function HomePage() {
  const router = useRouter();
  const { initializeAuth, authReady, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authReady && isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [authReady, isAuthenticated, router]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const backendLoginUrl = buildApiUrl("/api/auth/login");
      window.location.href = backendLoginUrl;
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Navigation */}
      <nav
        className="px-6 py-4 backdrop-blur-sm bg-opacity-80"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl transform transition-transform hover:scale-110"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            >
              <FaHeart className="text-white" />
            </div>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-text)" }}
            >
              KindCrew
            </span>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
            style={{
              backgroundColor: "var(--color-surface-hover)",
              color: "var(--color-text)",
            }}
          >
            {loading ? "Loading..." : "Sign In"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center space-y-12">
          {/* Main Heading */}
          <div className="space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface mb-4 animate-scale-in delay-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-gray-300">
                AI-Powered Content Platform
              </span>
            </div>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight"
              style={{ color: "var(--color-text)" }}
            >
              Create Content That
              <br />
              <span className="bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent">
                Inspires & Engages
              </span>
            </h1>
            <p
              className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Transform your ideas into compelling content with AI-powered
              ideation, generation, and analytics — all in one place
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center items-center pt-4 animate-fade-in-up delay-300">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-white text-black hover:bg-gray-50"
            >
              {loading ? "Connecting..." : "Get Started Free"}
            </button>
          </div>

          {/* Features Section */}
          <div className="pt-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white animate-fade-in-up delay-400">
              Everything You Need
            </h2>
            <p className="text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-500">
              From ideation to analytics, we&apos;ve got all the tools to help
              you succeed
            </p>

            {/* Primary Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="group p-8 rounded-2xl transition-all hover:scale-105 border border-border bg-surface hover:bg-surface-hover animate-fade-in-up delay-100">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 mx-auto transform group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <FiZap className="w-7 h-7 text-yellow-400" />
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "var(--color-text)" }}
                >
                  AI Ideation
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Generate unlimited content ideas tailored to your niche and
                  audience with powerful AI
                </p>
              </div>

              <div className="group p-8 rounded-2xl transition-all hover:scale-105 border border-border bg-surface hover:bg-surface-hover animate-fade-in-up delay-200">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 mx-auto transform group-hover:scale-110 transition-transform animate-float"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <FiEdit className="w-7 h-7 text-blue-400" />
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "var(--color-text)" }}
                >
                  Content Generation
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Create high-quality content in seconds with advanced AI models
                  and customizable tones
                </p>
              </div>

              <div className="group p-8 rounded-2xl transition-all hover:scale-105 border border-border bg-surface hover:bg-surface-hover animate-fade-in-up delay-300">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 mx-auto transform group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <FiCalendar className="w-7 h-7 text-green-400" />
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "var(--color-text)" }}
                >
                  Smart Planning
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Schedule and organize your content strategy with an intuitive
                  calendar interface
                </p>
              </div>
            </div>

            {/* Secondary Features */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-border bg-background hover:bg-surface transition-all animate-slide-in-left delay-400">
                <div className="flex items-center mx gap-3 mb-3">
                  <FiBarChart className="w-5 h-5 text-purple-400" />
                  <h4 className="font-semibold  text-white">Analytics</h4>
                </div>
                <p className="text-sm text-start text-gray-400">
                  Track performance and get AI-powered insights to improve your
                  content
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-background hover:bg-surface transition-all animate-scale-in delay-500">
                <div className="flex items-center gap-3 mb-3">
                  <FiShield className="w-5 h-5 text-green-400" />
                  <h4 className="font-semibold text-white">Secure & Private</h4>
                </div>
                <p className="text-sm text-start text-gray-400">
                  Enterprise-grade security with AWS Cognito authentication
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-background hover:bg-surface transition-all animate-slide-in-right delay-600">
                <div className="flex items-center gap-3 mb-3">
                  <FiTrendingUp className="w-5 h-5 text-orange-400" />
                  <h4 className="font-semibold text-white">Trend Analysis</h4>
                </div>
                <p className="text-sm text-start text-gray-400">
                  Stay ahead with real-time trend insights from Google Trends
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="pt-20 animate-fade-in-up delay-400">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-background p-12 md:p-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                Ready to Create?
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                Start your content creation journey with AI-powered tools
                designed for creators
              </p>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="px-10 py-4 text-lg font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-white text-black hover:bg-gray-50"
              >
                {loading ? "Connecting..." : "Start Creating Now"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="max-w-7xl mx-auto px-6 py-10 mt-16"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            >
              <FaHeart className="text-white" />
            </div>
            <span className="font-bold text-white">KindCrew</span>
          </div>
          <div
            className="text-sm text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <p>© 2026 KindCrew.</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a
              href="https://github.com/navyajain7105/AI-For-Bharat_KindCrew"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <FaGithub className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

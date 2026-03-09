"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { buildApiUrl } from "@/lib/constants";

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
        className="px-6 py-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            ></div>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              KindCrew
            </span>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1
              className="text-5xl md:text-7xl font-bold leading-tight"
              style={{ color: "var(--color-text)" }}
            >
              AI-Powered Content
              <br />
              <span
                className="font-bold"
                style={{
                  background:
                    "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                For Everyone
              </span>
            </h1>
            <p
              className="text-xl md:text-2xl max-w-3xl mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Create, collaborate, and scale your content with the power of
              artificial intelligence
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-surface-hover)",
                color: "var(--color-text)",
              }}
            >
              {loading ? "Connecting..." : "Get Started"}
            </button>
            <button
              className="px-8 py-4 text-lg font-semibold rounded-lg transition-all"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
              }}
            >
              Learn More
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 pt-20">
            <div
              className="p-6 rounded-xl transition-colors"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto"
                style={{ backgroundColor: "var(--color-surface-hover)" }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#60a5fa" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Lightning Fast
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Generate high-quality content in seconds with advanced AI
              </p>
            </div>

            <div
              className="p-6 rounded-xl transition-colors"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto"
                style={{ backgroundColor: "var(--color-surface-hover)" }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#a78bfa" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Secure & Private
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Enterprise-grade security with AWS Cognito authentication
              </p>
            </div>

            <div
              className="p-6 rounded-xl transition-colors"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto"
                style={{ backgroundColor: "var(--color-surface-hover)" }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#34d399" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Collaborate
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Work together with your team in real-time
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="max-w-7xl mx-auto px-6 py-8 mt-20"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div
          className="text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <p>© 2026 KindCrew. Powered by AI For Bharat.</p>
        </div>
      </footer>
    </div>
  );
}

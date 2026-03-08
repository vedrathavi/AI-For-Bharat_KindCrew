"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import {
  FiArrowRight,
  FiCheck,
  FiFolder,
  FiHome,
  FiLayers,
} from "react-icons/fi";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("id");

  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl w-full mx-auto">
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Success Icon */}
          <div className="mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            >
              <FiCheck className="w-10 h-10 text-green-500" />
            </div>
          </div>

          {/* Success Message */}
          <h1
            className="text-3xl font-bold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Idea Saved Successfully
          </h1>
          <p className="mb-8" style={{ color: "var(--color-text-secondary)" }}>
            Your content idea has been approved and saved to your library.
            {ideaId && (
              <span className="block mt-2 text-sm">
                <span
                  className="font-mono px-2 py-1 rounded"
                  style={{
                    backgroundColor: "var(--color-surface-hover)",
                    color: "var(--color-text)",
                  }}
                >
                  {ideaId}
                </span>
              </span>
            )}
          </p>

          {/* Next Steps */}
          <div
            className="rounded-lg p-6 mb-8 text-left"
            style={{ backgroundColor: "var(--color-surface-hover)" }}
          >
            <h3
              className="font-semibold mb-3"
              style={{ color: "var(--color-text)" }}
            >
              What Is Next?
            </h3>
            <ul
              className="space-y-2 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <li className="flex items-start gap-2">
                <FiArrowRight className="w-4 h-4 mt-0.5" />
                <span>Your idea is ready for Phase 2: Content Structuring</span>
              </li>
              <li className="flex items-start gap-2">
                <FiArrowRight className="w-4 h-4 mt-0.5" />
                <span>View all your saved ideas in My Ideas</span>
              </li>
              <li className="flex items-start gap-2">
                <FiArrowRight className="w-4 h-4 mt-0.5" />
                <span>Generate more ideas to build your content pipeline</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/ideation/my-ideas")}
              className="w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--color-text)",
                color: "var(--color-background)",
              }}
            >
              <FiFolder className="w-4 h-4" />
              View My Ideas
            </button>
            <button
              onClick={() => router.push("/ideation")}
              className="w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--color-surface-hover)",
                color: "var(--color-text)",
              }}
            >
              <FiLayers className="w-4 h-4" />
              Generate Another Idea
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2 font-medium transition-colors flex items-center justify-center gap-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <FiHome className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>

        <div
          className="mt-8 text-center text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <p>Coming soon: Content Structuring and Script Generation</p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

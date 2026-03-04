"use client";

import Link from "next/link";
import { FiAlertCircle } from "react-icons/fi";

type SetupBannerProps = {
  onDismiss?: () => void;
};

export default function SetupBanner({ onDismiss }: SetupBannerProps) {
  return (
    <div
      className="p-4 sm:p-6 rounded-xl mb-6 border"
      style={{
        background:
          "linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)",
        borderColor: "rgba(96, 165, 250, 0.3)",
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle
              className="w-5 h-5"
              style={{ color: "var(--color-text)" }}
            />
            <h3
              className="text-lg sm:text-xl font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Complete Your Setup
            </h3>
          </div>
          <p
            className="text-sm sm:text-base"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Finish setting up your creator profile to unlock all features and
            get personalized content recommendations.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
              }}
            >
              Later
            </button>
          )}
          <Link
            href="/onboarding"
            className="flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium transition-colors text-sm"
            style={{
              background: "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
              color: "var(--color-white)",
            }}
          >
            Complete Setup
          </Link>
        </div>
      </div>
    </div>
  );
}

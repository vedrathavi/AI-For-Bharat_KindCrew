"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

export default function ContentPage() {
  const router = useRouter();
  const { isAuthenticated, authReady } = useAuth();

  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  if (!authReady) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div style={{ color: "var(--color-text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-4"
          style={{ color: "var(--color-text)" }}
        >
          Content
        </h1>
        <div
          className="p-8 rounded-xl text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p
            className="text-lg"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Content creation features coming soon...
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

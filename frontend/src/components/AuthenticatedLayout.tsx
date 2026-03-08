"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { FiMenu } from "react-icons/fi";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, authReady, logout, initializeAuth } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileClosing, setMobileClosing] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow || "";
    }
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [mobileOpen]);

  const closeDrawer = () => {
    setMobileClosing(true);
    setTimeout(() => {
      setMobileClosing(false);
      setMobileOpen(false);
    }, 300);
  };

  const toggleDrawer = () => {
    if (mobileOpen) {
      closeDrawer();
    } else {
      setMobileOpen(true);
    }
  };

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

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div
      className="min-h-screen w-full max-w-full flex overflow-x-hidden"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 z-30">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onLogout={logout}
        />
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <button
          onClick={toggleDrawer}
          aria-label="Open menu"
          className="fixed top-3 left-3 z-40 p-2 rounded-lg shadow-lg"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
          }}
        >
          <FiMenu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {(mobileOpen || mobileClosing) && (
        <div
          className={`lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeDrawer}
        >
          <div
            className={`w-64 max-w-[85vw] h-full overflow-hidden shadow-2xl transition-transform duration-300 ${
              mobileClosing ? "-translate-x-full" : "translate-x-0"
            }`}
            style={{
              backgroundColor: "var(--color-surface)",
              borderRight: "1px solid var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              collapsed={false}
              setCollapsed={() => {}}
              onLogout={logout}
              onCloseDrawer={closeDrawer}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 min-w-0 w-full overflow-x-hidden transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="w-full max-w-full p-3 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

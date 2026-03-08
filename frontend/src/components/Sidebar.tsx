"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  FiHome,
  FiUser,
  FiEdit,
  FiCompass,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

type SidebarProps = {
  onLogout: () => void;
  collapsed?: boolean;
  setCollapsed?: (value: boolean) => void;
  onCloseDrawer?: () => void;
};

export default function Sidebar({
  onLogout,
  collapsed = false,
  setCollapsed,
  onCloseDrawer,
}: SidebarProps) {
  const pathname = usePathname();
  const { userInfo } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: FiHome },
    { name: "Ideation", href: "/ideation", icon: FiCompass },
    { name: "Profile", href: "/profile", icon: FiUser },
    { name: "Content", href: "/content", icon: FiEdit },
    { name: "Analytics", href: "/analytics", icon: FiBarChart2 },
    { name: "Settings", href: "/settings", icon: FiSettings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div
      className={`${collapsed ? "w-20" : "w-64"} h-full min-h-screen flex flex-col ${onCloseDrawer ? "border-r-0" : "border-r"} lg:border-r transition-all duration-300`}
      style={{
        backgroundColor: "var(--color-surface)",
        borderRightColor: "var(--color-border)",
      }}
    >
      {/* Mobile Close Button */}
      {onCloseDrawer && (
        <div className="p-4 flex justify-end lg:hidden">
          <button
            onClick={onCloseDrawer}
            className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Logo */}
      <div
        className="p-6 border-b flex items-center justify-between"
        style={{ borderBottomColor: "var(--color-border)" }}
      >
        {!collapsed && (
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
        )}
        {collapsed && (
          <div
            className="w-8 h-8 rounded-lg mx-auto"
            style={{ backgroundColor: "var(--color-surface-hover)" }}
          ></div>
        )}

        {/* Desktop Collapse Toggle */}
        {setCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex ml-2 p-1.5 rounded-lg hover:bg-opacity-50 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <FiChevronRight className="w-4 h-4" />
            ) : (
              <FiChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div
          className="p-4 border-b"
          style={{ borderBottomColor: "var(--color-border)" }}
        >
          <div className="flex items-center space-x-3">
            {userInfo?.profileImage ? (
              <img
                src={userInfo.profileImage}
                alt={userInfo.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-surface-hover)" }}
              >
                <span style={{ color: "var(--color-text)" }}>
                  {userInfo?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--color-text)" }}
              >
                {userInfo?.givenName && userInfo?.familyName
                  ? `${userInfo.givenName} ${userInfo.familyName}`
                  : userInfo?.name || "User"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {userInfo?.email || ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {collapsed && userInfo && (
        <div
          className="p-4 border-b flex justify-center"
          style={{ borderBottomColor: "var(--color-border)" }}
        >
          {userInfo?.profileImage ? (
            <img
              src={userInfo.profileImage}
              alt={userInfo.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            >
              <span style={{ color: "var(--color-text)" }}>
                {userInfo?.name?.charAt(0) || "U"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"} px-4 py-3 rounded-lg transition-colors`}
              style={{
                backgroundColor: active
                  ? "var(--color-surface-hover)"
                  : "transparent",
                color: active
                  ? "var(--color-text)"
                  : "var(--color-text-secondary)",
              }}
              title={collapsed ? item.name : undefined}
              onClick={onCloseDrawer}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div
        className="p-4 border-t"
        style={{ borderTopColor: "var(--color-border)" }}
      >
        <button
          onClick={() => {
            onLogout();
            if (onCloseDrawer) onCloseDrawer();
          }}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "space-x-3"} px-4 py-3 rounded-lg transition-colors hover:bg-opacity-50`}
          style={{
            backgroundColor: "transparent",
            color: "var(--color-text-secondary)",
          }}
          title={collapsed ? "Logout" : undefined}
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}

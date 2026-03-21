"use client";

import { useTranslations } from "next-intl";

import { Arrow } from "@/components/brand";

export interface SidebarFooterProps {
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  /** When true, shows icon-only layout (desktop collapsed) */
  collapsed?: boolean;
  /** Optional root class (e.g. "shrink-0 px-5 py-4" for mobile drawer) */
  className?: string;
}

export function SidebarFooter({
  userName,
  userEmail,
  onLogout,
  collapsed = false,
  className,
}: SidebarFooterProps) {
  const t = useTranslations("sidebar");

  const rootClass = className
    ? `border-ink/6 border-t ${className}`.trim()
    : `border-ink/6 border-t ${collapsed ? "space-y-1 px-2 py-3" : "px-3 py-4"}`;

  return (
    <div className={rootClass}>
      {!collapsed && (userName || userEmail) && (
        <div className="mb-2">
          {userName && (
            <div className="text-ink/70 truncate font-sans text-xs font-semibold">
              {userName}
            </div>
          )}
          {userEmail && (
            <div className="text-ink/30 truncate font-mono text-xs">{userEmail}</div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onLogout}
        className={`hover:bg-ink/4 rounded-badge flex cursor-pointer items-center transition-colors ${
          collapsed ? "w-full justify-center p-2" : "gap-1.5 px-3 py-1.5"
        }`}
        title={collapsed ? t("log_out") : undefined}>
        <Arrow s={12} d="r" />
        {!collapsed && (
          <span className="text-ink/40 hover:text-ink/60 font-sans text-xs font-semibold">
            {t("log_out")}
          </span>
        )}
      </button>
    </div>
  );
}

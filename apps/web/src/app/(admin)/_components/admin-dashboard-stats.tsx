"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/use-translations";
import type { AdminStats } from "@/app/api/admin/stats/route";

export function AdminDashboardStats() {
  const t = useTranslations("admin.dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) {
          setError(t("error_load"));
          return;
        }
        return res.json();
      })
      .then((data: AdminStats | undefined) => {
        if (data) setStats(data);
      })
      .catch(() => setError(t("error_load")));
  }, [t]);

  if (error) {
    return (
      <p className="font-sans text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (stats === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-card bg-surface"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  const cards = [
    { label: t("total_users"), value: stats.totalUsers },
    { label: t("total_logged_items"), value: stats.totalLoggedItems },
    { label: t("recent_signups"), value: stats.recentSignups },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-card border border-border bg-card p-5 shadow-sm"
        >
          <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-serif text-2xl font-semibold text-ink">
            {value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

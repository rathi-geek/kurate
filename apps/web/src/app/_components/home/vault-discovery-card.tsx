"use client";

import Link from "next/link";

import { useTranslations } from "@/i18n/use-translations";
import { track } from "@/app/_libs/utils/analytics";

enum CardText {
  DaysAgo = "days_ago",
}

interface VaultDiscoveryCardProps {
  title: string | null;
  url: string;
  createdAt: string;
}

export function VaultDiscoveryCard({ title, url, createdAt }: VaultDiscoveryCardProps) {
  const t = useTranslations("discovery");

  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  const createdMs = Date.parse(createdAt);
  const days = Number.isFinite(createdMs)
    ? Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24))
    : null;

  const daysText = t(CardText.DaysAgo, { count: days ?? 0 });
  const showDaysText = days != null;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("link_opened", { context: "discovery" })}
      className="bg-card border-border hover:border-border/80 flex w-44 shrink-0 flex-col gap-1.5 rounded-xl border p-3 min-h-24 transition-shadow hover:shadow-sm">
      <p className="text-foreground line-clamp-2 text-sm leading-snug font-medium min-h-10">
        {title ?? domain}
      </p>
      <p className="text-muted-foreground truncate text-xs min-h-4">{domain}</p>
      <p
        className={`text-muted-foreground/70 text-xs min-h-4 ${showDaysText ? "" : "opacity-0"}`}>
        {daysText}
      </p>
    </Link>
  );
}

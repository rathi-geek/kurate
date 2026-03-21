"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n";

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

  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-card border-border hover:border-border/80 flex w-44 shrink-0 flex-col gap-1.5 rounded-xl border p-3 transition-shadow hover:shadow-sm">
      <p className="text-foreground line-clamp-2 text-sm font-medium leading-snug">
        {title ?? domain}
      </p>
      <p className="text-muted-foreground truncate text-xs">{domain}</p>
      <p className="text-muted-foreground/70 text-xs">
        {t(CardText.DaysAgo, { count: days })}
      </p>
    </Link>
  );
}

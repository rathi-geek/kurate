"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ContentType } from "@/app/_libs/chat-types";
import { createClient } from "@/app/_libs/supabase/client";
import { MOCK_ITEMS } from "@/app/_mocks/mock-data";
import { BrandArch, BrandStar } from "@/components/brand";

interface VaultItem {
  id: string;
  url: string;
  title: string | null;
  source: string | null;
  content_type: ContentType;
  preview_image: string | null;
  read_time: string | null;
  save_source: string;
  shared_to_groups: string[];
  author: string | null;
  created_at: string;
  rating?: number;
  tags?: string[];
}

interface VaultLibraryProps {
  refreshKey: number;
  onItemClick: (url: string) => void;
  panelMode?: boolean;
  initialGroup?: string;
}

type SourceFilter = "all" | "logged" | "discovered";
type ContentTypeFilter = "all" | "articles" | "videos" | "podcasts";

const SOURCE_PILL_KEYS = [
  { value: "all" as SourceFilter, labelKey: "filter_all" as const },
  { value: "logged" as SourceFilter, labelKey: "filter_logged" as const },
  { value: "discovered" as SourceFilter, labelKey: "filter_discovered" as const },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="mt-1 flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? "text-amber" : "text-border"}>
          <BrandStar s={10} c="currentColor" />
        </span>
      ))}
    </div>
  );
}

export function VaultLibrary({ refreshKey, onItemClick, panelMode = false }: VaultLibraryProps) {
  const t = useTranslations("vault");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>("all");

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);

    async function fetchItems() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data, error } = await supabase
          .from("logged_items")
          .select(
            "id, url, title, source, content_type, preview_image, read_time, save_source, shared_to_groups, author, created_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[VaultLibrary] fetch error (table may not exist):", error.message);
          if (!cancelled) setItems(MOCK_ITEMS as VaultItem[]);
          return;
        }
        if (!cancelled) {
          if (data && data.length > 0) {
            setItems(
              (data as VaultItem[]).map((d) => ({
                ...d,
                shared_to_groups:
                  (d as VaultItem & { shared_to_groups?: string[] }).shared_to_groups ?? [],
              })),
            );
          } else {
            setItems(MOCK_ITEMS as VaultItem[]);
          }
        }
      } catch (err) {
        console.warn("[VaultLibrary] unexpected error:", err);
        if (!cancelled) setItems(MOCK_ITEMS as VaultItem[]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredItems = items.filter((item) => {
    if (sourceFilter !== "all") {
      const sourceMatch =
        sourceFilter === "logged"
          ? item.save_source === "logged"
          : item.save_source === "feed" || item.save_source === "discovered";
      if (!sourceMatch) return false;
    }
    if (contentTypeFilter !== "all") {
      const map: Record<ContentTypeFilter, ContentType | null> = {
        all: null,
        articles: "article",
        videos: "video",
        podcasts: "podcast",
      };
      const want = map[contentTypeFilter];
      if (want != null && item.content_type !== want) return false;
    }
    return true;
  });

  async function handleDelete(item: VaultItem, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const supabase = createClient();
      await supabase.from("logged_items").delete().eq("id", item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.warn("[VaultLibrary] delete error:", err);
    }
  }

  if (!loaded) {
    if (!panelMode) return null;
    return (
      <div className="p-5">
        <p className="text-muted-foreground font-mono text-xs font-bold tracking-widest uppercase">
          {t("title")}
        </p>
        <p className="text-muted-foreground mt-2 font-sans text-xs">{t("loading")}</p>
      </div>
    );
  }

  if (items.length === 0) {
    if (!panelMode) return null;
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center p-6">
        <BrandArch s={48} className="text-ink/20 mb-4" />
        <p className="text-muted-foreground text-center font-sans text-sm">{t("empty_prompt")}</p>
      </div>
    );
  }

  const gridClass = panelMode
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div className={panelMode ? "space-y-4 p-5" : "mt-8 space-y-4"}>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground font-mono text-xs font-bold tracking-widest uppercase">
          {t("title")}
        </p>
        <span className="text-muted-foreground font-mono text-xs">
          {t("items_count", { count: filteredItems.length })}
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1.5">
          {SOURCE_PILL_KEYS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSourceFilter(value)}
              className={`rounded-badge px-3 py-1.5 font-sans text-xs font-medium transition-colors ${
                sourceFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:bg-brand-50"
              }`}>
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className={gridClass}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-card border-border bg-card group relative overflow-hidden border transition-shadow hover:shadow-md">
            <button
              type="button"
              onClick={() => onItemClick(item.url)}
              className="block w-full text-left">
              {item.preview_image ? (
                <img src={item.preview_image} alt="" className="h-[120px] w-full object-cover" />
              ) : (
                <div className="bg-muted flex h-[120px] w-full items-center justify-center">
                  <span
                    className={`rounded-badge px-2 py-1 font-mono text-xs font-bold uppercase ${
                      item.content_type === "video"
                        ? "bg-info-bg text-info-foreground"
                        : item.content_type === "podcast"
                          ? "bg-warning-bg text-warning-foreground"
                          : "bg-brand-50 text-primary"
                    }`}>
                    {item.content_type}
                  </span>
                </div>
              )}
              <div className="p-3">
                <h3 className="text-foreground line-clamp-2 pr-8 font-sans text-sm leading-snug font-bold">
                  {item.title || item.url}
                </h3>
                {item.rating != null && item.rating >= 1 && item.rating <= 5 && (
                  <StarRating rating={Math.round(item.rating)} />
                )}
                {(item.tags?.length ?? 0) > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(item.tags ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-muted-foreground bg-surface rounded px-1.5 py-0.5 font-mono text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                  {item.source ?? "—"}
                </p>
                {item.read_time && (
                  <p className="text-muted-foreground mt-1 font-mono text-xs">
                    {item.read_time} {t("read_suffix")}
                  </p>
                )}
              </div>
            </button>
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t("options_aria")}>
                    <span className="text-lg leading-none">⋯</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onItemClick(item.url)}>
                    {t("open")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.share) {
                        navigator.share({
                          title: item.title ?? undefined,
                          url: item.url,
                        });
                      } else {
                        window.open(item.url, "_blank", "noopener");
                      }
                    }}>
                    {t("share")}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={(e) => handleDelete(item, e)}>
                    {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

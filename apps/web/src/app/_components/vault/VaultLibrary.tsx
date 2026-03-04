"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/_libs/supabase/client";
import { BrandArch, BrandStar } from "@/components/brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { ContentType } from "@/app/_libs/chat-types";
import { MOCK_ITEMS } from "@/app/_libs/mock-data";

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

const SOURCE_PILLS: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "logged", label: "Logged" },
  { value: "discovered", label: "Discovered" },
];

const CONTENT_PILLS: { value: ContentTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "articles", label: "Articles" },
  { value: "videos", label: "Videos" },
  { value: "podcasts", label: "Podcasts" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 mt-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <BrandStar
          key={i}
          s={10}
          c={i <= rating ? "#F59E0B" : "#E5E7EB"}
        />
      ))}
    </div>
  );
}

export function VaultLibrary({
  refreshKey,
  onItemClick,
  panelMode = false,
}: VaultLibraryProps) {
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data, error } = await supabase
          .from("logged_items")
          .select("id, url, title, source, content_type, preview_image, read_time, save_source, shared_to_groups, author, created_at")
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
                shared_to_groups: (d as VaultItem & { shared_to_groups?: string[] }).shared_to_groups ?? [],
              }))
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
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-ink/30">
          Your Vault
        </p>
        <p className="font-sans text-xs text-ink/40 mt-2">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    if (!panelMode) return null;
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[180px]">
        <BrandArch s={48} className="text-ink/20 mb-4" />
        <p className="font-sans text-sm text-muted-foreground text-center">
          Nothing saved yet. Drop a link to get started.
        </p>
      </div>
    );
  }

  const gridClass = panelMode
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div className={panelMode ? "p-5 space-y-4" : "mt-8 space-y-4"}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-ink/30">
          Your Vault
        </p>
        <span className="font-mono text-xs text-ink/20">{filteredItems.length} items</span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1.5">
          {SOURCE_PILLS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSourceFilter(value)}
              className={`px-3 py-1.5 rounded-full font-sans text-xs font-medium transition-colors ${
                sourceFilter === value
                  ? "bg-ink text-white"
                  : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {CONTENT_PILLS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setContentTypeFilter(value)}
              className={`px-3 py-1.5 rounded-full font-sans text-xs font-medium transition-colors ${
                contentTypeFilter === value
                  ? "bg-ink text-white"
                  : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={gridClass}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="relative rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow group"
          >
            <button
              type="button"
              onClick={() => onItemClick(item.url)}
              className="text-left w-full block"
            >
              {item.preview_image ? (
                <img
                  src={item.preview_image}
                  alt=""
                  className="w-full h-[120px] object-cover"
                />
              ) : (
                <div className="w-full h-[120px] flex items-center justify-center bg-muted">
                  <span
                    className="font-mono text-xs font-bold uppercase px-2 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        item.content_type === "video"
                          ? "#D8C9F020"
                          : item.content_type === "podcast"
                            ? "#F0C27A20"
                            : "#1A5C4B15",
                      color:
                        item.content_type === "video"
                          ? "#7C3AED"
                          : item.content_type === "podcast"
                            ? "#B8860B"
                            : "#1A5C4B",
                    }}
                  >
                    {item.content_type}
                  </span>
                </div>
              )}
              <div className="p-3">
                <h3 className="font-sans text-sm font-bold text-foreground leading-snug line-clamp-2 pr-8">
                  {item.title || item.url}
                </h3>
                {item.rating != null && item.rating >= 1 && item.rating <= 5 && (
                  <StarRating rating={Math.round(item.rating)} />
                )}
                {(item.tags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(item.tags ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-xs text-ink/50 bg-ink/5 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  {item.source ?? "—"}
                </p>
                {item.read_time && (
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {item.read_time} read
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
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Options"
                  >
                    <span className="text-lg leading-none">⋯</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onItemClick(item.url)}>
                    Open
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
                    }}
                  >
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={(e) => handleDelete(item, e)}>
                    Delete
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

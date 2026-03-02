"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/_libs/supabase/client";
import type { ContentType } from "@/app/_libs/chat-types";

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
}

interface VaultLibraryProps {
  refreshKey: number;
  onItemClick: (url: string) => void;
  panelMode?: boolean;
  initialGroup?: string;
}

export function VaultLibrary({
  refreshKey,
  onItemClick,
  panelMode = false,
}: VaultLibraryProps) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loaded, setLoaded] = useState(false);

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
          if (!cancelled) setItems([]);
          return;
        }
        if (!cancelled && data) {
          setItems(
            (data as VaultItem[]).map((d) => ({
              ...d,
              shared_to_groups: (d as VaultItem & { shared_to_groups?: string[] }).shared_to_groups ?? [],
            }))
          );
        }
      } catch (err) {
        console.warn("[VaultLibrary] unexpected error:", err);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!loaded) {
    if (!panelMode) return null;
    return (
      <div className="p-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/30">
          Your Vault
        </p>
        <p className="font-sans text-[12px] text-ink/40 mt-2">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    if (!panelMode) return null;
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[120px]">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/20 mb-3">
          Your Vault
        </p>
        <p className="font-sans text-[13px] text-muted-foreground text-center leading-relaxed">
          Links you log will appear here,
          <br />
          as you paste them in the Logging tab.
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
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/30">
          Your Vault
        </p>
        <span className="font-mono text-[11px] text-ink/20">{items.length} items</span>
      </div>
      <div className={gridClass}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick(item.url)}
            className="text-left rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
          >
            {item.preview_image ? (
              <img
                src={item.preview_image}
                alt=""
                className="w-full h-[120px] object-cover"
              />
            ) : (
              <div
                className="w-full h-[120px] flex items-center justify-center bg-muted"
              >
                <span
                  className="font-mono text-[9px] font-bold uppercase px-2 py-1 rounded-full"
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
              <h3 className="font-sans text-[14px] font-bold text-foreground leading-snug line-clamp-2">
                {item.title || item.url}
              </h3>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                {item.source ?? "—"}
              </p>
              {item.read_time && (
                <p className="font-mono text-[10px] text-muted-foreground mt-1">
                  {item.read_time} read
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

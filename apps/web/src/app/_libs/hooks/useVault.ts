"use client";

import { useCallback, useEffect, useState } from "react";

import { startOfDay, subDays } from "date-fns";

import { createClient } from "@/app/_libs/supabase/client";
import type {
  ContentType,
  SaveSource,
  VaultFilters,
  VaultItem,
  VaultPagination,
} from "@/app/_libs/types/vault";
import { MOCK_ITEMS } from "@/app/_mocks/mock-data";

const PAGE_SIZE = 20;

function normalizeRow(row: Record<string, unknown>): VaultItem {
  return {
    ...row,
    content_type: (row.content_type as ContentType) ?? "article",
    save_source: (row.save_source as SaveSource) ?? "logged",
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    shared_to_groups: Array.isArray(row.shared_to_groups) ? (row.shared_to_groups as string[]) : [],
  } as VaultItem;
}

function mockToVaultItem(m: (typeof MOCK_ITEMS)[number]): VaultItem {
  return {
    id: m.id,
    user_id: "",
    url: m.url,
    title: m.title,
    source: m.source,
    author: m.author,
    preview_image: m.preview_image,
    content_type: m.content_type,
    read_time: m.read_time,
    remarks: null,
    tags: m.tags ?? [],
    raw_metadata: null,
    created_at: m.created_at,
    save_source: m.save_source as SaveSource,
    shared_to_groups: m.shared_to_groups ?? [],
    shared_from_name: null,
    shared_from_handle: null,
  };
}

export function useVault(filters: VaultFilters, refreshKey: number) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [pagination, setPagination] = useState<VaultPagination>({
    hasMore: false,
    lastCreatedAt: null,
    isLoading: true,
    isLoadingMore: false,
  });

  const fetchPage = useCallback(
    async (cursor: string | null, isLoadMore: boolean) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPagination((p) => ({ ...p, isLoading: false, isLoadingMore: false }));
        return;
      }

      if (isLoadMore) {
        setPagination((p) => ({ ...p, isLoadingMore: true }));
      }

      try {
        let query = supabase
          .from("logged_items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE);

        if (cursor) {
          query = query.lt("created_at", cursor);
        }

        const { time, contentType, search } = filters;

        if (time !== "all") {
          const now = new Date();
          const from =
            time === "today"
              ? startOfDay(now).toISOString()
              : time === "week"
                ? subDays(now, 7).toISOString()
                : subDays(now, 30).toISOString();
          query = query.gte("created_at", from);
        }

        if (contentType !== "all") {
          query = query.eq("content_type", contentType);
        }

        if (search.trim()) {
          const q = search.trim().replace(/%/g, "\\%");
          query = query.or(
            `title.ilike.%${q}%,source.ilike.%${q}%,author.ilike.%${q}%,remarks.ilike.%${q}%`,
          );
        }

        const { data, error } = await query;

        if (error) {
          console.warn("[useVault] fetch error:", error.message);
          if (!isLoadMore) {
            setItems(MOCK_ITEMS.map(mockToVaultItem));
            setPagination({
              hasMore: false,
              lastCreatedAt: null,
              isLoading: false,
              isLoadingMore: false,
            });
          } else {
            setPagination((p) => ({ ...p, isLoadingMore: false }));
          }
          return;
        }

        const rows = (data ?? []).map(normalizeRow);
        const lastCreatedAt = rows.length > 0 ? rows[rows.length - 1].created_at : null;

        if (isLoadMore) {
          setItems((prev) => [...prev, ...rows]);
        } else {
          setItems(rows);
        }

        setPagination({
          hasMore: rows.length === PAGE_SIZE,
          lastCreatedAt,
          isLoading: false,
          isLoadingMore: false,
        });
      } catch (err) {
        console.warn("[useVault] unexpected error:", err);
        if (!isLoadMore) {
          setItems(MOCK_ITEMS.map(mockToVaultItem));
          setPagination({
            hasMore: false,
            lastCreatedAt: null,
            isLoading: false,
            isLoadingMore: false,
          });
        } else {
          setPagination((p) => ({ ...p, isLoadingMore: false }));
        }
      }
    },
    [filters.time, filters.contentType, filters.search],
  );

  useEffect(() => {
    setPagination((p) => ({ ...p, isLoading: true }));
    fetchPage(null, false);
  }, [refreshKey, fetchPage]);

  const loadMore = useCallback(async () => {
    const { lastCreatedAt, hasMore, isLoadingMore } = pagination;
    if (!hasMore || isLoadingMore || !lastCreatedAt) return;
    await fetchPage(lastCreatedAt, true);
  }, [
    pagination.hasMore,
    pagination.isLoadingMore,
    pagination.lastCreatedAt,
    fetchPage,
  ]);

  const deleteItem = useCallback(async (id: string) => {
    const previous = items.find((i) => i.id === id);
    const index = previous ? items.indexOf(previous) : -1;
    setItems((prev) => prev.filter((i) => i.id !== id));

    const supabase = createClient();
    const { error } = await supabase.from("logged_items").delete().eq("id", id);

    if (error) {
      console.warn("[useVault] delete error:", error.message);
      if (previous !== undefined && index >= 0) {
        setItems((prev) => {
          const next = [...prev];
          next.splice(index, 0, previous);
          return next;
        });
      }
    }
  }, [items]);

  const updateRemarks = useCallback(async (id: string, remarks: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, remarks } : i)),
    );

    const supabase = createClient();
    await supabase.from("logged_items").update({ remarks }).eq("id", id);
  }, []);

  const saveItem = useCallback(async (url: string): Promise<"saved" | "duplicate" | "error"> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "error";

    let meta: {
      title?: string;
      source?: string;
      author?: string | null;
      previewImage?: string | null;
      contentType?: string;
      readTime?: string | null;
      description?: string | null;
    };
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      meta = res.ok
        ? await res.json()
        : {
            title: url,
            source: undefined,
            author: undefined,
            previewImage: undefined,
            contentType: "article",
            readTime: undefined,
          };
    } catch {
      meta = {
        title: url,
        source: undefined,
        author: undefined,
        previewImage: undefined,
        contentType: "article",
        readTime: undefined,
      };
    }

    const raw_metadata =
      meta.description != null ? { description: meta.description } : null;

    const { error } = await supabase.from("logged_items").upsert(
      {
        user_id: user.id,
        url,
        title: meta.title ?? url,
        source: meta.source ?? null,
        author: meta.author ?? null,
        preview_image: meta.previewImage ?? null,
        content_type: meta.contentType ?? "article",
        read_time: meta.readTime ?? null,
        save_source: "logged",
        shared_to_groups: [],
        raw_metadata,
      },
      { onConflict: "user_id,url" },
    );

    if (error) {
      if (error.code === "23505") return "duplicate";
      return "error";
    }
    return "saved";
  }, []);

  return {
    items,
    pagination,
    loadMore,
    deleteItem,
    updateRemarks,
    saveItem,
  };
}

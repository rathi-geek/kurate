"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { ArticleReader } from "@/app/_components/reader/article-reader";
import { PodcastPlayer } from "@/app/_components/reader/PodcastPlayer";
import { VideoPlayer } from "@/app/_components/reader/VideoPlayer";
import type { SourceRect, VaultItem } from "@/app/_libs/types/vault";

interface MediaPlayerState {
  item: VaultItem | null;
  sourceRect: SourceRect | null;
}

interface MediaPlayerContextValue {
  openItem: (item: VaultItem, sourceRect?: SourceRect) => void;
  closeItem: () => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextValue | null>(null);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MediaPlayerState>({ item: null, sourceRect: null });

  const openItem = useCallback((item: VaultItem, sourceRect?: SourceRect) => {
    setState({ item, sourceRect: sourceRect ?? null });
  }, []);

  const closeItem = useCallback(() => {
    setState({ item: null, sourceRect: null });
  }, []);

  const { item, sourceRect } = state;

  return (
    <MediaPlayerContext.Provider value={{ openItem, closeItem }}>
      {children}

      <ArticleReader
        url={item?.content_type === "article" ? item.url : null}
        title={item?.content_type === "article" ? (item.title ?? undefined) : undefined}
        hostname={item?.content_type === "article" ? (item.raw_metadata?.source ?? undefined) : undefined}
        readTime={
          item?.content_type === "article" && item.raw_metadata?.read_time != null
            ? Number(item.raw_metadata.read_time)
            : undefined
        }
        onClose={closeItem}
      />

      {item?.content_type === "video" && (
        <VideoPlayer
          url={item.url}
          title={item.title}
          initialRect={sourceRect}
          onClose={closeItem}
        />
      )}

      {item?.content_type === "podcast" && (
        <PodcastPlayer
          url={item.url}
          title={item.title}
          source={item.raw_metadata?.source ?? undefined}
          onClose={closeItem}
        />
      )}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer(): MediaPlayerContextValue {
  const ctx = useContext(MediaPlayerContext);
  if (!ctx) throw new Error("useMediaPlayer must be used inside MediaPlayerProvider");
  return ctx;
}

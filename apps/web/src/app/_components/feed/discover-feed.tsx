"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BrandSunburst } from "@/components/brand";
import { decodeHtmlEntities } from "@kurate/utils";
import { MOCK_FEED_ITEMS, type FeedItem } from "@/app/_mocks/mock-data";

const CARD_STAGGER_MS = 80;
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * (CARD_STAGGER_MS / 1000) },
  }),
};

export interface DiscoverFeedProps {
  onItemClick: (item: FeedItem) => void;
  onSave: (item: FeedItem) => void;
}

type ContentFilter = "all" | "articles" | "videos" | "podcasts";

const FILTER_LABELS: { value: ContentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "articles", label: "Articles" },
  { value: "videos", label: "Videos" },
  { value: "podcasts", label: "Podcasts" },
];

function ContentTypeBadge({ type }: { type: FeedItem["contentType"] }) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <span className="shrink-0 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground bg-surface px-2 py-0.5 rounded">
      {label}
    </span>
  );
}

export function DiscoverFeed({ onItemClick, onSave }: DiscoverFeedProps) {
  const [filter, setFilter] = useState<ContentFilter>("all");

  const filterToContentType: Record<Exclude<ContentFilter, "all">, FeedItem["contentType"]> = {
    articles: "article",
    videos: "video",
    podcasts: "podcast",
  };

  const forYouItems = useMemo(() => {
    if (filter === "all") return MOCK_FEED_ITEMS;
    const contentType = filterToContentType[filter];
    return MOCK_FEED_ITEMS.filter((item) => item.contentType === contentType);
  }, [filter]);

  const isEmpty = MOCK_FEED_ITEMS.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <BrandSunburst s={64} className="text-ink/15 mb-6" />
        <p className="font-sans text-sm text-ink/50 text-center max-w-[280px]">
          Follow curators to see their recommendations here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Section 1 — Trending */}
      <section>
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Trending in your network
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
          {MOCK_FEED_ITEMS.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              custom={index}
              onClick={() => onItemClick(item)}
              className="shrink-0 min-w-[220px] rounded-card border border-border bg-card overflow-hidden text-left hover:border-primary/30 transition-colors"
            >
              <div className="aspect-[16/10] bg-brand-50 flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BrandSunburst s={32} className="text-primary/20" />
                )}
              </div>
              <div className="p-3">
                <p className="font-sans text-sm font-semibold text-foreground line-clamp-2">
                  {decodeHtmlEntities(item.title)}
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {item.hostname}
                  {item.readTime != null && ` · ${item.readTime} min`}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Section 2 — For You */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
            For you
          </h2>
          <div className="flex gap-1.5">
            {FILTER_LABELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-badge font-sans text-xs font-medium transition-colors ${
                  filter === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:bg-brand-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {forYouItems.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground py-8 text-center">
            No {filter === "all" ? "items" : filter} in your feed yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {forYouItems.map((item, index) => (
              <motion.li
                key={item.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                custom={index}
                className="rounded-card border border-border bg-card p-4 md:p-5"
              >
                <div className="flex gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center font-sans text-sm font-semibold text-primary">
                    {item.sharer?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {item.sharer?.name ?? "Someone"}
                      </span>{" "}
                      shared this
                    </p>
                    <button
                      type="button"
                      onClick={() => onItemClick(item)}
                      className="text-left mt-1.5 block w-full group"
                    >
                      <p className="font-sans text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {decodeHtmlEntities(item.title)}
                      </p>
                      {item.description && (
                        <p className="font-sans text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {decodeHtmlEntities(item.description)}
                        </p>
                      )}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.hostname}
                        {item.readTime != null && ` · ${item.readTime} min`}
                      </span>
                      <ContentTypeBadge type={item.contentType} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSave(item);
                      }}
                      className="mt-3 font-sans text-sm font-medium text-primary hover:underline"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

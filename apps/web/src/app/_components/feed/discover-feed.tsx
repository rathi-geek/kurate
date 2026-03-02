"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BrandSunburst } from "@/components/brand";
import { MOCK_FEED_ITEMS, type FeedItem } from "@/app/_libs/mock-data";

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
    <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-wider text-ink/40 bg-ink/5 px-2 py-0.5 rounded">
      {label}
    </span>
  );
}

export function DiscoverFeed({ onItemClick, onSave }: DiscoverFeedProps) {
  const [filter, setFilter] = useState<ContentFilter>("all");

  const forYouItems = useMemo(() => {
    if (filter === "all") return MOCK_FEED_ITEMS;
    return MOCK_FEED_ITEMS.filter((item) => item.contentType === filter);
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
        <h2 className="font-sans text-[11px] font-bold uppercase tracking-widest text-ink/35 mb-4">
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
              className="shrink-0 min-w-[220px] rounded-xl border border-border bg-card overflow-hidden text-left hover:border-teal/50 transition-colors"
            >
              <div className="aspect-[16/10] bg-teal/10 flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BrandSunburst s={32} className="text-teal/20" />
                )}
              </div>
              <div className="p-3">
                <p className="font-sans text-[14px] font-semibold text-foreground line-clamp-2">
                  {item.title}
                </p>
                <p className="font-mono text-[11px] text-ink/40 mt-1">
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
          <h2 className="font-sans text-[11px] font-bold uppercase tracking-widest text-ink/35">
            For you
          </h2>
          <div className="flex gap-1.5">
            {FILTER_LABELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-full font-sans text-[12px] font-medium transition-colors ${
                  filter === value
                    ? "bg-ink text-white"
                    : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {forYouItems.length === 0 ? (
          <p className="font-sans text-sm text-ink/40 py-8 text-center">
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
                className="rounded-xl border border-border bg-card p-4 md:p-5"
              >
                <div className="flex gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center font-sans text-sm font-semibold text-teal">
                    {item.sharer?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-[12px] text-ink/50">
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
                      <p className="font-sans text-[15px] font-semibold text-foreground group-hover:text-teal transition-colors line-clamp-1">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="font-sans text-[13px] text-ink/50 mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-mono text-[11px] text-ink/40">
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
                      className="mt-3 font-sans text-[13px] font-medium text-teal hover:underline"
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

/**
 * Mock data for DiscoverFeed and related components.
 */

export interface FeedItemSharer {
  name: string;
  avatar?: string;
}

export interface FeedItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  hostname: string;
  readTime?: number;
  contentType: "article" | "video" | "podcast";
  imageUrl?: string | null;
  sharer?: FeedItemSharer;
}

export const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: "feed-1",
    url: "https://example.com/essay-compounding",
    title: "How to Get Rich by Not Losing",
    description:
      "The key to wealth isn't picking winners—it's avoiding catastrophic losses and letting compounding do the work over decades.",
    hostname: "example.com",
    readTime: 8,
    contentType: "article",
    imageUrl: null,
    sharer: { name: "Suchet" },
  },
  {
    id: "feed-2",
    url: "https://paulgraham.com/startup-advice",
    title: "What I Wish I'd Known About Startups",
    description:
      "A distilled list of lessons from years of funding and advising startups. Focus on making something people want.",
    hostname: "paulgraham.com",
    readTime: 12,
    contentType: "article",
    imageUrl: null,
    sharer: { name: "Naman" },
  },
  {
    id: "feed-3",
    url: "https://youtube.com/watch?v=neural-nets",
    title: "Neural Networks Explained Visually",
    description:
      "Best visual explanation of how neural networks learn. From weights to backprop in under 20 minutes.",
    hostname: "youtube.com",
    readTime: 18,
    contentType: "video",
    imageUrl: null,
    sharer: { name: "Vivek" },
  },
  {
    id: "feed-4",
    url: "https://lexfridman.com/podcast-ep-1",
    title: "The Art of Long-Form Conversation",
    description:
      "Why long-form podcasts create a different kind of understanding. Plus notes on preparation and presence.",
    hostname: "lexfridman.com",
    readTime: 90,
    contentType: "podcast",
    imageUrl: null,
    sharer: { name: "Riya" },
  },
  {
    id: "feed-5",
    url: "https://blog.example.com/systems-thinking",
    title: "Systems Thinking for Product People",
    description:
      "How to see feedback loops, leverage points, and delays in your product and org—without the jargon.",
    hostname: "blog.example.com",
    readTime: 6,
    contentType: "article",
    imageUrl: null,
    sharer: { name: "Suchet" },
  },
];

/** Vault item shape for VaultLibrary (logged_items table / fallback) */
export interface VaultItemMock {
  id: string;
  url: string;
  title: string | null;
  source: string | null;
  content_type: "article" | "video" | "podcast";
  preview_image: string | null;
  read_time: string | null;
  save_source: string;
  shared_to_groups: string[];
  author: string | null;
  created_at: string;
  rating?: number;
  tags?: string[];
}

export const MOCK_ITEMS: VaultItemMock[] = [
  {
    id: "vault-mock-1",
    url: "https://example.com/essay-compounding",
    title: "How to Get Rich by Not Losing",
    source: "example.com",
    content_type: "article",
    preview_image: null,
    read_time: "8 min",
    save_source: "logged",
    shared_to_groups: [],
    author: null,
    created_at: new Date().toISOString(),
    rating: 5,
    tags: ["investing", "compounding", "career"],
  },
  {
    id: "vault-mock-2",
    url: "https://paulgraham.com/startup-advice",
    title: "What I Wish I'd Known About Startups",
    source: "paulgraham.com",
    content_type: "article",
    preview_image: null,
    read_time: "12 min",
    save_source: "feed",
    shared_to_groups: [],
    author: null,
    created_at: new Date().toISOString(),
    rating: 4,
    tags: ["startups", "advice"],
  },
  {
    id: "vault-mock-3",
    url: "https://youtube.com/watch?v=neural-nets",
    title: "Neural Networks Explained Visually",
    source: "youtube.com",
    content_type: "video",
    preview_image: null,
    read_time: "18 min",
    save_source: "feed",
    shared_to_groups: [],
    author: null,
    created_at: new Date().toISOString(),
    tags: ["ML", "tutorial"],
  },
];

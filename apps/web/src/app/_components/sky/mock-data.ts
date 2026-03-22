export const MOCK_CONSTELLATIONS = [
  {
    id: "big-dipper",
    name: "Big Dipper",
    items: [
      { id: "a", title: "The State of AI in 2025", content_type: "article" },
      { id: "b", title: "GPT-5 Deep Dive", content_type: "video" },
      { id: "c", title: "Building with Claude", content_type: "article" },
      { id: "d", title: "AI Agents Explained", content_type: "article" },
    ],
  },
];

export type MockConstellation = (typeof MOCK_CONSTELLATIONS)[number];
export type MockConstellationItem = MockConstellation["items"][number];

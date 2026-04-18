"use client";

import { decodeHtmlEntities } from "@kurate/utils";

interface SharedItem {
  id: string;
  title: string;
  source: string;
  sharedBy: string;
  sharedAt: Date;
}

const MOCK_SHARED_ITEMS: SharedItem[] = [
  { id: "1", title: "The Future of AI Agents", source: "a16z.com", sharedBy: "@suchet", sharedAt: new Date("2024-01-15") },
  { id: "2", title: "Building Products Users Love", source: "pmarchive.com", sharedBy: "@naman", sharedAt: new Date("2024-01-14") },
  { id: "3", title: "React Server Components Deep Dive", source: "react.dev", sharedBy: "@arshia", sharedAt: new Date("2024-01-13") },
  { id: "4", title: "The Psychology of Product Design", source: " NN/g", sharedBy: "@priya", sharedAt: new Date("2024-01-12") },
];

export default function SharedPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
        Shared
      </p>

      <div className="space-y-3">
        {MOCK_SHARED_ITEMS.map((item) => (
          <div key={item.id} className="p-4 bg-card border rounded-xl hover:bg-accent/50 transition-colors cursor-pointer">
            <h3 className="font-medium mb-1">{decodeHtmlEntities(item.title)}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>·</span>
              <span>Shared by {item.sharedBy}</span>
              <span>·</span>
              <span>{item.sharedAt.toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {MOCK_SHARED_ITEMS.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No shared content yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Content shared with you will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

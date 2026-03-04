"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { createClient } from "@/app/_libs/supabase/client";
import { MOCK_GROUPS, getMembersForGroup } from "@/app/_libs/contacts";

interface GroupContentItem {
  id: string;
  title: string;
  source: string;
  contentType: "article" | "video" | "podcast";
  previewImage?: string;
  readTime?: string;
  sharedBy: string;
  timeLabel: string;
}

const MOCK_GROUP_CONTENT: GroupContentItem[] = [
  { id: "1", title: "The Future of AI Agents", source: "a16z.com", contentType: "article", readTime: "8 min read", sharedBy: "@suchet", timeLabel: "2 hours ago" },
  { id: "2", title: "Building Products Users Love", source: "pmarchive.com", contentType: "article", readTime: "12 min read", sharedBy: "@naman", timeLabel: "5 hours ago" },
  { id: "3", title: "React Server Components Deep Dive", source: "react.dev", contentType: "article", readTime: "15 min read", sharedBy: "@arshia", timeLabel: "1 day ago" },
];

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [userEmail, setUserEmail] = useState("");

  const currentGroup = MOCK_GROUPS.find((g) => g.slug === slug);
  const members = currentGroup ? getMembersForGroup(currentGroup) : [];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  if (!currentGroup) {
    return (
      <div className="h-screen flex bg-background">
        <AppSidebar userEmail={userEmail} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Group not found</p>
            <button
              onClick={() => router.push("/chat")}
              className="text-sm text-primary hover:underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <AppSidebar userEmail={userEmail} onLogout={handleLogout} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7.5 9.5L4 6l3.5-3.5" />
            </svg>
            Home
          </button>

          <div className="flex items-center gap-4 mb-6">
            {/* Dynamic group color — runtime value, no static token */}
            <div
              className="w-12 h-12 flex items-center justify-center rounded-xl"
              style={{ backgroundColor: `${currentGroup.color}20` }}
            >
              {/* Dynamic group color — runtime value, no static token */}
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentGroup.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentGroup.name}</h1>
              <p className="text-sm text-muted-foreground">{currentGroup.members} members</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.handle}
                  className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold rounded-full border-2 border-background"
                >
                  {m.name[0]}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {members.map((m) => m.name).join(", ")}
            </span>
          </div>

          <div className="space-y-4">
            {MOCK_GROUP_CONTENT.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-card border rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-secondary rounded-full capitalize">
                    {item.contentType}
                  </span>
                  {item.readTime && (
                    <span className="text-xs text-muted-foreground">{item.readTime}</span>
                  )}
                </div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>Shared by {item.sharedBy}</span>
                  <span>·</span>
                  <span>{item.timeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

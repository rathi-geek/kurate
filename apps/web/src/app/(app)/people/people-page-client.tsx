"use client";

import { useAuth } from "@/app/_libs/auth-context";
import { useDMConversations } from "@/app/_libs/hooks/useDMConversations";
import { PeoplePanel } from "@/app/_components/sidebar/PeoplePanel";

export function PeoplePageClient() {
  const { user, loading } = useAuth();
  const { conversations, isLoading } = useDMConversations(user?.id ?? null);

  return (
    <PeoplePanel
      userId={user?.id ?? null}
      conversations={conversations}
      isLoading={loading || isLoading}
    />
  );
}

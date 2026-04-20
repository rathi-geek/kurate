"use client";

import { useState } from "react";

import { useTranslations } from "@/i18n/use-translations";
import { LuChevronDown } from "react-icons/lu";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { ROUTES } from "@kurate/utils";
import { queryKeys } from "@kurate/query";
import type { DMConversation } from "@kurate/types";
import { fetchMessages } from "@/app/_libs/hooks/useMessages";
import { PlusIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FindUserSheet } from "@/app/_components/people/find-user-sheet";
import Link from "next/link";
import { UnreadBadge } from "@/app/_components/sidebar/unread-badge";
import { cn } from "@/app/_libs/utils/cn";

export interface SidebarPeopleSectionProps {
  collapsed?: boolean;
  /** Called when an item is clicked (e.g. to close mobile drawer) */
  onItemClick?: () => void;
  currentUserId?: string | null;
  conversations?: DMConversation[];
  unreadCounts?: Map<string, number>;
  markRead?: (convoId: string) => Promise<void>;
}

export function SidebarPeopleSection({
  collapsed = false,
  onItemClick,
  currentUserId = null,
  conversations = [],
  unreadCounts,
  markRead,
}: SidebarPeopleSectionProps) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <>
      <div className={collapsed ? "mt-4 px-2" : "mt-5 px-3"}>
        {!collapsed && (
          <div className="mb-2 flex items-center justify-between px-3">
            <button
              type="button"
              onClick={() => setSectionOpen((v) => !v)}
              className="flex items-center gap-1 text-left"
              title={sectionOpen ? "Collapse" : "Expand"}>
              <LuChevronDown
                className={cn(
                  "text-ink/25 h-3 w-3 transition-transform duration-150",
                  !sectionOpen && "-rotate-90",
                )}
              />
              <p className="text-ink/25 font-mono text-xs font-bold tracking-widest uppercase">
                {t("people")}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setNewMessageOpen(true)}
              className="text-ink/30 hover:text-ink/60 hover:bg-ink/6 rounded p-0.5 transition-colors"
              title="New message">
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {sectionOpen && <div className="space-y-0.5">
          {conversations.map((convo) => {
            const displayName =
              convo.otherUser.display_name ??
              (convo.otherUser.handle ? `@${convo.otherUser.handle}` : "Unknown");
            const initial = (displayName[0] ?? "?").toUpperCase();
            const unread = unreadCounts?.get(convo.id) ?? 0;

            const handleClick = () => {
              onItemClick?.();
              if (unread > 0) void markRead?.(convo.id);
            };

            const isActive = pathname === ROUTES.APP.PERSON(convo.id);
            return collapsed ? (
              <Link
                key={convo.id}
                href={ROUTES.APP.PERSON(convo.id)}
                title={displayName}
                onClick={handleClick}
                onMouseEnter={() => {
                  void queryClient.prefetchInfiniteQuery({
                    queryKey: queryKeys.people.messages(convo.id),
                    queryFn: ({ pageParam }) =>
                      fetchMessages(convo.id, pageParam as string | undefined),
                    initialPageParam: undefined,
                    staleTime: 1000 * 60,
                  });
                }}
                className="hover:bg-ink/4 flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors">
                <div className="relative">
                  <Avatar className="h-[26px] w-[26px]">
                    {convo.otherUser.avatar_url && (
                      <AvatarImage src={convo.otherUser.avatar_url} alt={displayName} />
                    )}
                    <AvatarFallback className="bg-ink text-cream font-sans text-xs font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <UnreadBadge
                    count={unread}
                    variant="dot"
                    className="absolute -top-0.5 -right-0.5"
                  />
                </div>
              </Link>
            ) : (
              <Link
                key={convo.id}
                href={ROUTES.APP.PERSON(convo.id)}
                onClick={handleClick}
                onMouseEnter={() => {
                  void queryClient.prefetchInfiniteQuery({
                    queryKey: queryKeys.people.messages(convo.id),
                    queryFn: ({ pageParam }) =>
                      fetchMessages(convo.id, pageParam as string | undefined),
                    initialPageParam: undefined,
                    staleTime: 1000 * 60,
                  });
                }}
                className={cn(
                  "rounded-badge flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors",
                  isActive ? "bg-ink/8" : "hover:bg-ink/4",
                )}>
                <Avatar className="h-[26px] w-[26px] shrink-0">
                  {convo.otherUser.avatar_url && (
                    <AvatarImage src={convo.otherUser.avatar_url} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-ink text-cream font-sans text-xs font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-ink truncate font-sans text-xs font-bold">{displayName}</div>
                  {convo.lastMessage && (
                    <div className="text-ink/35 truncate font-mono text-xs">
                      {convo.lastMessage.text}
                    </div>
                  )}
                </div>
                <UnreadBadge count={unread} variant="inline" className="ml-auto" />
              </Link>
            );
          })}

        </div>}
      </div>

      {currentUserId && (
        <FindUserSheet
          open={newMessageOpen}
          onOpenChange={setNewMessageOpen}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}

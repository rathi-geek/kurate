"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { ROUTES } from "@/app/_libs/constants/routes";
import { useDMConversations } from "@/app/_libs/hooks/useDMConversations";
import { createClient } from "@/app/_libs/supabase/client";
import { DotsHorizontalIcon, PlusIcon } from "@/components/icons";
import { FindUserSheet } from "@/components/people/find-user-sheet";
import { Link } from "@/i18n";

const supabase = createClient();

export interface SidebarPeopleSectionProps {
  collapsed?: boolean;
  /** Called when an item is clicked (e.g. to close mobile drawer) */
  onItemClick?: () => void;
}

export function SidebarPeopleSection({
  collapsed = false,
  onItemClick,
}: SidebarPeopleSectionProps) {
  const t = useTranslations("sidebar");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const { conversations } = useDMConversations(currentUserId);
  const displayed = conversations.slice(0, 5);

  return (
    <>
      <div className={collapsed ? "mt-4 px-2" : "mt-5 px-3"}>
        {!collapsed && (
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-ink/25 font-mono text-xs font-bold tracking-widest uppercase">
              {t("people")}
            </p>
            <button
              type="button"
              onClick={() => setNewMessageOpen(true)}
              className="text-ink/30 hover:text-ink/60 hover:bg-ink/6 rounded p-0.5 transition-colors"
              title="New message">
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="space-y-0.5">
          {displayed.map((convo) => {
            const displayName =
              convo.otherUser.display_name ??
              (convo.otherUser.handle ? `@${convo.otherUser.handle}` : "Unknown");
            const initial = (displayName[0] ?? "?").toUpperCase();

            return collapsed ? (
              <Link
                key={convo.id}
                href={ROUTES.APP.PERSON(convo.id)}
                title={displayName}
                onClick={onItemClick}
                className="hover:bg-ink/4 flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors">
                <div className="bg-ink text-cream flex h-[26px] w-[26px] items-center justify-center rounded-full font-sans text-xs font-bold">
                  {initial}
                </div>
              </Link>
            ) : (
              <Link
                key={convo.id}
                href={ROUTES.APP.PERSON(convo.id)}
                onClick={onItemClick}
                className="rounded-badge hover:bg-ink/4 flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors">
                <div className="bg-ink text-cream flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-ink truncate font-sans text-xs font-bold">{displayName}</div>
                  {convo.lastMessage && (
                    <div className="text-ink/35 truncate font-mono text-xs">
                      {convo.lastMessage.text}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          {/* See all link */}
          {!collapsed && conversations.length > 4 && (
            <Link
              href={ROUTES.APP.PEOPLE}
              onClick={onItemClick}
              className="rounded-badge hover:bg-ink/4 flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors">
              <div className="text-ink/30 flex h-[26px] w-[26px] shrink-0 items-center justify-center">
                <DotsHorizontalIcon className="h-3 w-3" />
              </div>
              <span className="text-ink/40 font-mono text-xs">See all</span>
            </Link>
          )}
        </div>
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

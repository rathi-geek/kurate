"use client";

import { useTranslations } from "next-intl";

import type { Contact } from "@/app/_libs/contacts";

import { useSidebarContextOptional } from "./sidebar-context";

export interface SidebarPeopleSectionProps {
  /** When provided, overrides context. When omitted, uses SidebarProvider value. */
  contacts?: Contact[];
  collapsed?: boolean;
  /** When provided, overrides context. */
  activeChatHandle?: string | null;
  /** When provided, overrides context. */
  onPersonClick?: (handle: string) => void;
  /** Called when an item is clicked (e.g. to close mobile drawer) */
  onItemClick?: () => void;
}

export function SidebarPeopleSection({
  contacts: contactsProp,
  collapsed = false,
  activeChatHandle: activeChatHandleProp,
  onPersonClick: onPersonClickProp,
  onItemClick,
}: SidebarPeopleSectionProps) {
  const t = useTranslations("sidebar");
  const context = useSidebarContextOptional();

  const contacts = contactsProp ?? context?.contacts ?? [];
  const activeChatHandle = activeChatHandleProp ?? context?.activeChatHandle;
  const onPersonClick = onPersonClickProp ?? context?.onPersonClick;

  return (
    <div className={collapsed ? "mt-4 px-2" : "mt-5 px-3"}>
      {!collapsed && (
        <p className="text-ink/25 mb-2 px-3 font-mono text-xs font-bold tracking-widest uppercase">
          {t("people")}
        </p>
      )}
      <div className="space-y-0.5">
        {contacts.map((p) => {
          const isActivePerson = activeChatHandle === p.handle;
          const handleClick = () => {
            onPersonClick?.(p.handle);
            onItemClick?.();
          };
          return collapsed ? (
            <button
              key={p.handle}
              type="button"
              title={`${p.name} ${p.handle}`}
              onClick={handleClick}
              className={`flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors ${
                isActivePerson ? "bg-teal/10" : "hover:bg-ink/4"
              }`}>
              <div className="relative">
                <div className="bg-ink text-cream flex h-[26px] w-[26px] items-center justify-center rounded-full font-sans text-xs font-bold">
                  {p.name[0]}
                </div>
                {p.online && (
                  <div className="bg-teal absolute -right-px -bottom-px h-[7px] w-[7px] rounded-full border-2 border-white" />
                )}
              </div>
            </button>
          ) : (
            <button
              key={p.handle}
              type="button"
              onClick={handleClick}
              className={`rounded-badge flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                isActivePerson ? "bg-teal/10" : "hover:bg-ink/4"
              }`}>
              <div className="relative shrink-0">
                <div className="bg-ink text-cream flex h-[26px] w-[26px] items-center justify-center rounded-full font-sans text-xs font-bold">
                  {p.name[0]}
                </div>
                {p.online && (
                  <div className="bg-teal absolute -right-px -bottom-px h-[7px] w-[7px] rounded-full border-2 border-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-ink font-sans text-xs font-bold">{p.name}</div>
                <div className="text-ink/35 font-mono text-xs">{p.handle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

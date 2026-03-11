"use client";

import { ChatInput } from "@/app/_components/home/chat-input";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";
import type { SourceRect, VaultItem } from "@/app/_libs/types/vault";

interface VaultTabViewProps {
  onSend: (text: string) => void;
  disabled: boolean;
  onItemClick: (item: VaultItem, sourceRect?: SourceRect) => void;
  onNavigateToDiscover?: () => void;
}

export function VaultTabView({
  onSend,
  disabled,
  onItemClick,
  onNavigateToDiscover,
}: VaultTabViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Scrollable vault content */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
        <VaultLibrary
          onItemClick={onItemClick}
          panelMode
          onNavigateToDiscover={onNavigateToDiscover}
        />
      </div>

      {/* Input pinned to bottom */}
      <div className="shrink-0 border-t border-border bg-background px-5 py-3">
        <div className="mx-auto max-w-2xl">
          <ChatInput onSend={onSend} placeholder="Paste a link to log it…" disabled={disabled} />
        </div>
      </div>
    </div>
  );
}

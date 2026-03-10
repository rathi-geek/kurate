"use client";

import { ChatInput } from "@/app/_components/home/chat-input";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";

interface VaultTabViewProps {
  onSend: (text: string) => void;
  disabled: boolean;
  vaultRefreshKey: number;
  onOpenArticle: (url: string) => void;
}

export function VaultTabView({
  onSend,
  disabled,
  vaultRefreshKey,
  onOpenArticle,
}: VaultTabViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Scrollable vault content */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
        <VaultLibrary refreshKey={vaultRefreshKey} onItemClick={onOpenArticle} panelMode />
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

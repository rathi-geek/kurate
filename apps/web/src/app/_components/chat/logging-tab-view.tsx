"use client";

import { ChatInput } from "@/app/_components/chat/chat-input";
import { VaultLibrary } from "@/app/_components/vault/VaultLibrary";

interface LoggingTabViewProps {
  onSend: (text: string) => void;
  disabled: boolean;
  vaultRefreshKey: number;
  onOpenArticle: (url: string) => void;
}

export function LoggingTabView({
  onSend,
  disabled,
  vaultRefreshKey,
  onOpenArticle,
}: LoggingTabViewProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="hidden shrink-0 md:block">
        <ChatInput
          onSend={onSend}
          placeholder="Paste a link to log it..."
          disabled={disabled}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
        <VaultLibrary
          refreshKey={vaultRefreshKey}
          onItemClick={onOpenArticle}
          panelMode
        />
      </div>
      <div className="shrink-0 border-t md:hidden">
        <ChatInput
          onSend={onSend}
          placeholder="Paste a link to log it..."
          disabled={disabled}
        />
      </div>
    </div>
  );
}

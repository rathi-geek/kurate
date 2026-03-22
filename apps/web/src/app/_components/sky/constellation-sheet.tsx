"use client";

import { ContentTypePill } from "@/components/ui/content-type-pill";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { MockConstellation, MockConstellationItem } from "./mock-data";

interface ConstellationSheetProps {
  constellation: MockConstellation | null;
  onClose: () => void;
}

export function ConstellationSheet({
  constellation,
  onClose,
}: ConstellationSheetProps) {
  return (
    <Sheet open={!!constellation} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col p-0">
        {constellation && (
          <>
            <SheetHeader className="border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="bg-primary size-2.5 rounded-full" />
                <SheetTitle className="text-base">
                  {constellation.name}
                </SheetTitle>
                <span className="text-muted-foreground ml-auto text-xs">
                  {constellation.items.length} items
                </span>
              </div>
            </SheetHeader>
            <div className="divide-border flex-1 divide-y overflow-y-auto">
              {constellation.items.map((item) => (
                <ConstellationSheetItem key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ConstellationSheetItem({ item }: { item: MockConstellationItem }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <ContentTypePill contentType={item.content_type} className="mt-0.5" />
      <span className="text-sm leading-snug">{item.title}</span>
    </div>
  );
}

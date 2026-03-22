"use client";

import { useState } from "react";

import { ConstellationCanvas } from "@/app/_components/sky/constellation-canvas";
import { ConstellationSheet } from "@/app/_components/sky/constellation-sheet";
import { MOCK_CONSTELLATIONS } from "@/app/_components/sky/mock-data";

export function SkyTabView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = MOCK_CONSTELLATIONS.find((c) => c.id === activeId) ?? null;

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <ConstellationCanvas
        constellations={MOCK_CONSTELLATIONS}
        onClusterClick={setActiveId}
      />

      {/* Floating "New Constellation" button */}
      <button
        type="button"
        className="absolute right-6 bottom-6 flex items-center gap-1.5 rounded-full bg-[#143d60]/10 px-4 py-2 text-sm font-medium text-[#143d60] backdrop-blur-sm transition-colors hover:bg-[#143d60]/20"
      >
        ＋ New Constellation
      </button>

      <ConstellationSheet
        constellation={active}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
}

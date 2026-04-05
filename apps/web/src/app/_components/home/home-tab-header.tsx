"use client";

import { LuEllipsisVertical } from "react-icons/lu";

import { BrandConcentricArch } from "@/components/brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidingTabs } from "@/components/ui/sliding-tabs";
import { useTranslations } from "@/i18n/use-translations";
import { HomeTab } from "@kurate/types";

interface HomeTabHeaderProps {
  activeTab: HomeTab;
  onChange: (tab: HomeTab) => void;
}

export function HomeTabHeader({ activeTab, onChange }: HomeTabHeaderProps) {
  const t = useTranslations("chat");

  const tabs = [
    { value: HomeTab.VAULT, label: t("tab_vault") },
    { value: HomeTab.DISCOVERING, label: t("tab_discovering") },
  ];

  const activeLabel = tabs.find((tab) => tab.value === activeTab)?.label ?? "";

  return (
    <>
      {/* Mobile header — hidden on sm+ */}
      <div className="flex items-center justify-between px-4 py-3 sm:hidden">
        <div className="flex items-center gap-2">
          <BrandConcentricArch s={20} className="text-ink" />
          <span className="font-sans text-lg font-black text-ink">{activeLabel}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors">
              <LuEllipsisVertical size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {tabs.map((tab) => (
              <DropdownMenuItem
                key={tab.value}
                onClick={() => onChange(tab.value)}
                className={activeTab === tab.value ? "font-semibold" : ""}
              >
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop tabs — hidden on mobile */}
      <div className="hidden shrink-0 items-center justify-center py-3 sm:flex sm:pt-3">
        <SlidingTabs
          value={activeTab}
          onChange={(v) => onChange(v as HomeTab)}
          tabs={tabs}
        />
      </div>
    </>
  );
}

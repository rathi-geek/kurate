"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@kurate/utils";
import { useTranslations } from "@/i18n/use-translations";

interface JoinErrorViewProps {
  title: string;
  description: string;
}

export function JoinErrorView({ title, description }: JoinErrorViewProps) {
  const router = useRouter();
  const t = useTranslations("groups");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="size-5 text-destructive"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="mb-1.5 font-sans text-base font-semibold text-foreground">{title}</h2>
        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">{description}</p>

        <button
          type="button"
          onClick={() => router.push(ROUTES.APP.HOME)}
          className="w-full rounded-card bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          {t("join_go_home")}
        </button>
      </div>
    </div>
  );
}

import { BUCKET_BADGE_COLOR, BUCKET_META, type ThoughtBucket } from "@kurate/utils";

import { useTranslations } from "@/i18n/use-translations";
import { formatTime } from "@/app/_components/home/thoughts/utils";

interface BucketCardProps {
  bucket: ThoughtBucket;
  latestText: string | null;
  latestCreatedAt: string | null;
  unreadCount: number;
  onClick: () => void;
}

export function BucketCard({
  bucket,
  latestText,
  latestCreatedAt,
  unreadCount,
  onClick,
}: BucketCardProps) {
  const meta = BUCKET_META[bucket];
  const t = useTranslations("thoughts");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors"
      style={{ backgroundColor: `var(${meta.colorVar})` }}>
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-semibold">{meta.label}</p>
        <p className="text-ink/45 mt-0.5 truncate text-xs">
          {latestText || t("no_thoughts_yet")}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {latestCreatedAt && (
          <span className="text-ink/30 text-[10px]">{formatTime(latestCreatedAt)}</span>
        )}
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none text-white"
              style={{ backgroundColor: BUCKET_BADGE_COLOR[bucket] }}>
              {unreadCount}
            </span>
          )}
          <svg className="text-ink/30 size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

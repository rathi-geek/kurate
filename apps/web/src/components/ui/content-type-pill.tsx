import { cn } from "@/app/_libs/utils/cn";

const contentTypePillClass: Record<string, string> = {
  article: "bg-brand-50 text-primary",
  video: "bg-info-bg text-info-foreground",
  podcast: "bg-warning-bg text-warning-foreground",
  tweet: "bg-sky-50 text-sky-700",
  substack: "bg-orange-50 text-orange-700",
  spotify: "bg-emerald-50 text-emerald-700",
  link: "bg-muted text-muted-foreground",
};

interface ContentTypePillProps {
  contentType: string | null | undefined;
  className?: string;
}

export function ContentTypePill({ contentType, className }: ContentTypePillProps) {
  const type = contentType ?? "article";
  return (
    <span
      className={cn(
        "rounded-badge px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase",
        contentTypePillClass[type] ?? contentTypePillClass.article,
        className,
      )}>
      {type}
    </span>
  );
}

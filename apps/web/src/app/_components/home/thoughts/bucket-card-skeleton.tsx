import { Skeleton } from "@/components/ui/skeleton";

export function BucketCardSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex w-full items-center justify-between rounded-xl bg-accent/40 px-4 py-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-[40%] rounded-md" />
            <Skeleton className="h-3 w-[60%] rounded-md" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Skeleton className="h-2.5 w-8 rounded-md" />
            <Skeleton className="size-4 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}

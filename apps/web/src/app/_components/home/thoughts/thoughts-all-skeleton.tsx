import { Skeleton } from "@/components/ui/skeleton";

export function ThoughtsAllSkeleton() {
  const widths = ["60%", "45%", "72%", "38%", "55%", "50%"];
  return (
    <div className="space-y-1 px-5 py-2">
      {widths.map((w, i) => (
        <div key={i} className="flex justify-end py-0.5">
          <Skeleton className="h-9 rounded-2xl rounded-br-sm" style={{ width: w }} />
        </div>
      ))}
    </div>
  );
}

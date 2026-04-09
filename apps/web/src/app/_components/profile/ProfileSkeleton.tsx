export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 h-4 w-16 animate-pulse rounded bg-card" />

      <div className="mb-6 flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-card" />
        <div className="flex-1">
          <div className="mb-2 h-7 w-40 animate-pulse rounded bg-card" />
          <div className="mb-2 h-4 w-24 animate-pulse rounded bg-card" />
          <div className="h-4 w-64 animate-pulse rounded bg-card" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-xl bg-card" />
        ))}
      </div>

      <div className="h-48 w-full animate-pulse rounded-xl bg-card" />
    </div>
  );
}

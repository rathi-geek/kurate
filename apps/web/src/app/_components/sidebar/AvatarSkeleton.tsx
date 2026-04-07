export function AvatarSkeleton({ size = 18 }: { size?: number }) {
  return (
    <div
      className="bg-ink/10 shrink-0 animate-pulse rounded-full"
      style={{ width: size, height: size }}
    />
  );
}

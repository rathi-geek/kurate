export function AvatarSkeleton({ size = 18 }: { size?: number }) {
  return (
    <div
      className="shrink-0 animate-pulse rounded-full bg-white"
      style={{ width: size, height: size }}
    />
  );
}

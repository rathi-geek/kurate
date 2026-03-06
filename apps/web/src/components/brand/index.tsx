interface IconProps {
  s?: number;
  c?: string;
  className?: string;
}

interface ArrowProps extends IconProps {
  d?: "r" | "l" | "u" | "d";
}

export function BrandStar({ s = 20, c = "currentColor", className }: IconProps) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={c}
      className={className}
    >
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
    </svg>
  );
}

export function BrandCircle({ s = 20, c = "#1A1A1A", className }: IconProps) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      className={className}
    >
      <circle cx="12" cy="12" r="11" fill={c} />
    </svg>
  );
}

export function BrandArch({ s = 32, c = "#1A1A1A", className }: IconProps) {
  return (
    <svg
      width={s}
      height={s * 1.3}
      viewBox="0 0 40 52"
      fill="none"
      stroke={c}
      strokeWidth="3.5"
      className={className}
    >
      <path d="M4 52V22C4 11 12 2 20 2C28 2 36 11 36 22V52" />
    </svg>
  );
}

export function BrandSunburst({ s = 40, c = "#1A1A1A", className }: IconProps) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={24 + 8 * Math.cos(a)}
            y1={24 + 8 * Math.sin(a)}
            x2={24 + 22 * Math.cos(a)}
            y2={24 + 22 * Math.sin(a)}
          />
        );
      })}
    </svg>
  );
}

export function BrandLogo({ name, s = 24, className }: { name: string; s?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2${className ? ` ${className}` : ""}`}>
      <BrandConcentricArch s={s} className="text-ink" />
      <span className="font-sans font-black text-xl text-ink tracking-tight">{name}</span>
    </div>
  );
}

export function BrandConcentricArch({
  s = 40,
  c = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={s}
      height={s * 0.75}
      viewBox="0 0 48 36"
      fill="none"
      stroke={c}
      strokeWidth="3"
      className={className}
    >
      <path d="M6 36V20C6 12 12 6 24 6C36 6 42 12 42 20V36" />
      <path d="M14 36V22C14 17 18 13 24 13C30 13 34 17 34 22V36" />
      <path d="M21 36V25C21 23 22 22 24 22C26 22 27 23 27 25V36" />
    </svg>
  );
}

export function Arrow({
  s = 18,
  c = "currentColor",
  d = "r",
  className,
}: ArrowProps) {
  const rotation =
    d === "d" ? 90 : d === "u" ? -90 : d === "l" ? 180 : 0;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ transform: `rotate(${rotation}deg)` }}
      className={className}
    >
      <path d="M5 12H19M13 6L19 12L13 18" />
    </svg>
  );
}

export function Checkmark({ s = 18, c = "#1A1A1A", className }: IconProps) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="3.5"
      strokeLinecap="round"
      className={className}
    >
      <path d="M5 12L10 17L19 7" />
    </svg>
  );
}

export function Cross({ s = 16, c = "#1A1A1A", className }: IconProps) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="3"
      strokeLinecap="round"
      className={className}
    >
      <path d="M6 6L18 18M18 6L6 18" />
    </svg>
  );
}

interface FloatDecoProps {
  children: React.ReactNode;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  opacity?: number;
  rotate?: number;
}

export function FloatDeco({
  children,
  top,
  left,
  right,
  bottom,
  opacity = 0.06,
  rotate = 0,
}: FloatDecoProps) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        opacity,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
}

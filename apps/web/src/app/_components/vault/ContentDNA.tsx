"use client";

import type { InterestCount } from "@/app/_libs/hooks/useContentDNA";

const PALETTE = ["#171717", "#2d6a4f", "#b8a4d8", "#c9963a", "#8a8a8a", "#c4c4c4"];

const CX = 90;
const CY = 90;
const R = 68;
const STROKE_W = 26;
const C = 2 * Math.PI * R;
const GAP = 5;

interface ContentDNAProps {
  interests: InterestCount[];
  totalItems: number;
}

export function ContentDNA({ interests, totalItems }: ContentDNAProps) {
  const top = interests;

  if (top.length < 2) return null;

  const total = top.reduce((s, { count }) => s + count, 0);

  let cumulative = 0;
  const segments = top.map(({ name, count }, i) => {
    const fraction = count / total;
    const arcLen = fraction * C;
    const drawLen = Math.max(0, arcLen - GAP);
    const offset = C - cumulative;
    cumulative += arcLen;
    return {
      tag: name,
      count,
      fraction,
      pct: Math.round(fraction * 100),
      drawLen,
      offset,
      color: PALETTE[i % PALETTE.length],
    };
  });

  return (
    <div className="mb-8">
      <p className="text-muted-foreground mb-4 font-mono text-xs font-medium tracking-wider uppercase">
        Content DNA
      </p>

      <div className="bg-card border-border rounded-card border p-5">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="bg-foreground size-2 shrink-0 rounded-full" />
          <h2 className="text-foreground font-sans text-base font-semibold italic">Content DNA</h2>
        </div>
        <p className="text-muted-foreground mb-5 font-sans text-sm">
          What makes up your reading identity
        </p>

        {/* Donut chart */}
        <div className="mb-6 flex justify-center">
          <svg
            width={180}
            height={180}
            viewBox="0 0 180 180"
            aria-label="Content DNA donut chart"
            role="img">
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_W}
              className="text-muted/40"
            />
            {segments.map(({ tag, drawLen, offset, color }) => (
              <circle
                key={tag}
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={color}
                strokeWidth={STROKE_W}
                strokeDasharray={`${drawLen} ${C}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${CX} ${CY})`}
              />
            ))}
            <text
              x={CX}
              y={CY - 7}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "var(--font-dm-sans, sans-serif)",
              }}>
              {totalItems}
            </text>
            <text
              x={CX}
              y={CY + 11}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: "0.14em",
                fill: "#9ca3af",
                fontFamily: "var(--font-dm-mono, monospace)",
              }}>
              ITEMS
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {segments.map(({ tag, pct, fraction, color }) => (
            <div key={tag} className="flex items-center gap-3">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-foreground w-24 shrink-0 truncate font-sans text-sm capitalize">
                {tag}
              </span>
              <div className="bg-muted h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${fraction * 100}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-muted-foreground w-8 shrink-0 text-right font-mono text-xs">
                {pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

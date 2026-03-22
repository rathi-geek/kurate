"use client";

import { useCallback, useRef, useState } from "react";

import { ConstellationCluster } from "./constellation-cluster";
import type { MockConstellation } from "./mock-data";

interface ConstellationCanvasProps {
  constellations: MockConstellation[];
  onClusterClick: (id: string) => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 6;

// ── Background stars ──────────────────────────────────────────────────────────
// 140 regular stars + 12 brighter accent stars, all deterministic
const STARS_REGULAR = Array.from({ length: 140 }, (_, i) => {
  const h = ((i * 2654435761) >>> 0) % 100000;
  const h2 = ((i * 1013904223) >>> 0) % 100000;
  return {
    key: i,
    cx: `${(h % 9800) / 100}%`,
    cy: `${(h2 % 9800) / 100}%`,
    r: 0.3 + ((h % 9) / 10),        // 0.3–1.2
    opacity: 0.25 + ((h % 45) / 100), // 0.25–0.70
  };
});

const STARS_BRIGHT = Array.from({ length: 12 }, (_, i) => {
  const h = ((i * 374761393 + 999983) >>> 0) % 100000;
  const h2 = ((i * 668265261 + 444443) >>> 0) % 100000;
  return {
    key: i,
    cx: `${(h % 9200) / 100}%`,
    cy: `${(h2 % 9200) / 100}%`,
    r: 1.4 + ((h % 8) / 10),        // 1.4–2.2
    opacity: 0.7 + ((h % 25) / 100), // 0.70–0.95
  };
});

export function ConstellationCanvas({
  constellations,
  onClusterClick,
}: ConstellationCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setTransform((prev) => {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      const ratio = newScale / prev.scale;
      return {
        scale: newScale,
        x: mouseX - ratio * (mouseX - prev.x),
        y: mouseY - ratio * (mouseY - prev.y),
      };
    });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const stopDrag = useCallback(() => {
    dragging.current = false;
  }, []);

  const constellation = constellations[0];

  return (
    <svg
      ref={svgRef}
      className="h-full w-full select-none"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      style={{ cursor: "grab" }}
    >
      <defs>
        {/* ── Sky gradient ── */}
        {/* Base: deep near-black navy at top, slightly richer indigo-blue at bottom */}
        <linearGradient id="sky-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04060f" />
          <stop offset="55%" stopColor="#080e22" />
          <stop offset="100%" stopColor="#0c1530" />
        </linearGradient>

        {/* Milky Way band: soft diagonal radial glow offset to one side */}
        <radialGradient id="sky-milkyway" cx="65%" cy="45%" r="55%">
          <stop offset="0%"   stopColor="#1a2b5e" stopOpacity="0.35" />
          <stop offset="40%"  stopColor="#0e1840" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Subtle purple-teal nebula hint in opposite corner */}
        <radialGradient id="sky-nebula" cx="20%" cy="75%" r="35%">
          <stop offset="0%"   stopColor="#1e1045" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Constellation star glow */}
        <filter id="star-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Tiny glow for bright background stars */}
        <filter id="bg-star-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Sky layers ── */}
      <rect width="100%" height="100%" fill="url(#sky-base)" />
      <rect width="100%" height="100%" fill="url(#sky-milkyway)" />
      <rect width="100%" height="100%" fill="url(#sky-nebula)" />

      {/* ── Background stars ── */}
      {/* Regular tiny stars */}
      {STARS_REGULAR.map((s) => (
        <circle
          key={s.key}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="white"
          opacity={s.opacity}
        />
      ))}
      {/* Brighter accent stars with a subtle glow */}
      {STARS_BRIGHT.map((s) => (
        <circle
          key={s.key}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="white"
          opacity={s.opacity}
          filter="url(#bg-star-glow)"
        />
      ))}

      {/* ── Pannable / zoomable constellation ── */}
      <g
        transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}
      >
        {constellation && (
          <ConstellationCluster
            constellation={constellation}
            onClick={() => onClusterClick(constellation.id)}
          />
        )}
      </g>

      {/* Hint */}
      <text
        x="12"
        y="20"
        fill="rgba(255,255,255,0.25)"
        fontSize="10"
        fontFamily="var(--font-sans)"
      >
        scroll to zoom · drag to pan
      </text>
    </svg>
  );
}

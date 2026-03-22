"use client";

import { useEffect, useState } from "react";

import { motion, useAnimation } from "framer-motion";

import {
  BIG_DIPPER_STARS,
  BIG_DIPPER_TOTAL,
} from "@/app/_libs/utils/constellationLayout";

import type { MockConstellation } from "./mock-data";

interface ConstellationClusterProps {
  constellation: MockConstellation;
  onClick: () => void;
}

const SEGMENT_DURATION = 0.75; // line draw duration per segment
const SEGMENT_GAP = 0.75; // next segment starts immediately after previous (no pause)

/** 5-pointed star SVG path centered at (cx, cy), top-pointing. */
function starPath(cx: number, cy: number, outerR: number): string {
  const inner = outerR * 0.42;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : inner;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  });
  return `M ${pts.join(" L ")} Z`;
}

interface FilledStarProps {
  cx: number;
  cy: number;
  /** When to start the pop-in (seconds). */
  popDelay: number;
  /** Index for staggering the heartbeat phase. */
  index: number;
}

function FilledStar({ cx, cy, popDelay, index }: FilledStarProps) {
  const controls = useAnimation();

  useEffect(() => {
    const run = async () => {
      // Smooth fade+scale in — starts slightly before line arrives so they overlap
      await controls.start({
        opacity: 1,
        scale: 1,
        transition: {
          delay: Math.max(0, popDelay),
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1], // smooth decelerate
        },
      });
      // Slow blink: more pronounced opacity swing with scale
      void controls.start({
        scale: [1, 1.18, 1],
        opacity: [0.8, 1, 0.8],
        transition: {
          duration: 2.2 + index * 0.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.5,
        },
      });
    };
    void run();
  }, [controls, popDelay, index]);

  return (
    <motion.path
      d={starPath(cx, cy, 8)}
      fill="white"
      filter="url(#star-glow)"
      initial={{ opacity: 0, scale: 0.1 }}
      animate={controls}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    />
  );
}

export function ConstellationCluster({
  constellation,
  onClick,
}: ConstellationClusterProps) {
  const [hovered, setHovered] = useState(false);

  const filledCount = constellation.items.length;
  const stars = BIG_DIPPER_STARS;

  const maxY = Math.max(...stars.map((s) => s.y));
  const midX =
    (Math.min(...stars.map((s) => s.x)) + Math.max(...stars.map((s) => s.x))) /
    2;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}
    >
      {/* ── Bowl-closing structural edge: Dubhe(6) → Megrez(3) ── */}
      <line
        x1={stars[6].x}
        y1={stars[6].y}
        x2={stars[3].x}
        y2={stars[3].y}
        stroke="white"
        strokeWidth={0.6}
        strokeDasharray="5 7"
        opacity={0.12}
      />

      {/* ── Empty segments (dim dashed capacity hint) ── */}
      {Array.from({ length: BIG_DIPPER_TOTAL - 1 }, (_, i) => {
        if (i < filledCount - 1) return null;
        const from = stars[i];
        const to = stars[i + 1];
        return (
          <line
            key={`empty-seg-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="white"
            strokeWidth={0.8}
            strokeDasharray="6 8"
            opacity={0.18}
          />
        );
      })}

      {/* ── Animated fill segments — seamless back-to-back, white with glow ── */}
      {Array.from({ length: filledCount - 1 }, (_, i) => {
        const from = stars[i];
        const to = stars[i + 1];
        return (
          <motion.path
            key={`fill-seg-${i}`}
            d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
            stroke="white"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            filter="url(#star-glow)"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{
              pathLength: 1,
              opacity: [1, 1, 0.75, 1, 0.75, 1], // heartbeat kicks in after draw
            }}
            transition={{
              pathLength: {
                duration: SEGMENT_DURATION,
                delay: i * SEGMENT_GAP,
                ease: "linear",
              },
              opacity: {
                duration: 2.8,
                delay: i * SEGMENT_GAP + SEGMENT_DURATION, // starts after line finishes
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />
        );
      })}

      {/* ── All 7 stars at base opacity (filled ones get animation on top) ── */}
      {Array.from({ length: BIG_DIPPER_TOTAL }, (_, i) => {
        const star = stars[i];
        return (
          <path
            key={`base-star-${i}`}
            d={starPath(star.x, star.y, 6)}
            fill="rgba(255,255,255,0.15)"
            stroke="white"
            strokeWidth={1}
            opacity={0.4}
          />
        );
      })}

      {/* ── Filled stars — pop in as line arrives, then blink ── */}
      {Array.from({ length: filledCount }, (_, i) => {
        const star = stars[i];
        // Start 0.15s before the incoming line finishes so transition feels seamless
        const popDelay =
          i === 0 ? 0 : i * SEGMENT_GAP + SEGMENT_DURATION - 0.15;
        return (
          <FilledStar
            key={`filled-star-${i}`}
            cx={star.x}
            cy={star.y}
            popDelay={popDelay}
            index={i}
          />
        );
      })}

      {/* ── Labels ── */}
      <text
        x={midX}
        y={maxY + 24}
        textAnchor="middle"
        fill={hovered ? "#6ee7b7" : "rgba(255,255,255,0.75)"}
        fontSize="13"
        fontStyle="italic"
        fontFamily="var(--font-sans)"
        letterSpacing="0.1em"
        opacity={0.8}
        style={{ fontVariant: "small-caps", pointerEvents: "none" }}
      >
        {constellation.name}
      </text>
      <text
        x={midX}
        y={maxY + 40}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize="10"
        fontFamily="var(--font-sans)"
        opacity={0.6}
        style={{ pointerEvents: "none" }}
      >
        {filledCount} / {BIG_DIPPER_TOTAL} stars
      </text>
    </g>
  );
}

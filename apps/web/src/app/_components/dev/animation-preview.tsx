"use client";

/**
 * AnimationPreview — dev-only floating panel.
 * Click any row to play it in the large stage at the top.
 * Returns null in production (NODE_ENV inlined at build time).
 */

import { AnimatePresence, motion ,type  Variants,type  Transition } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { useState } from "react";

import {
  cardStagger,
  fadeIn,
  fadeUp,
  fadeUpHero,
  hoverLift,
  hoverLiftSlight,
  hoverScale,
  messageVariants,
  pageVariants,
  slideInLeft,
  slideInRight,
  slideUpSmall,
  springBouncy,
  springGentle,
  springHeavy,
  springSnappy,
  springTab,
  spinnerTransition,
  staggerContainer,
  staggerContainerSlow,
  staggerItem,
  tabVariants,
  tapScale,
} from "@/lib/motion-variants";

// ─── Types ────────────────────────────────────────────────────────────────

type BaseItem = { name: string; desc: string };

type VariantItem =
  | (BaseItem & { kind: "variant"; variants: Variants })
  | (BaseItem & { kind: "stagger"; container: Variants; item: Variants })
  | (BaseItem & { kind: "card-stagger" })
  | (BaseItem & { kind: "interactive"; motionProps: Record<string, unknown>; hint: string })
  | (BaseItem & { kind: "spring"; transition: Transition })
  | (BaseItem & { kind: "spinner" });

type Group = { label: string; items: VariantItem[] };

// ─── Data ─────────────────────────────────────────────────────────────────

const GROUPS: Group[] = [
  {
    label: "Spring Transitions",
    items: [
      { kind: "spring", name: "springSnappy", desc: "400 / 25 — sidebar, icon rotate", transition: springSnappy },
      { kind: "spring", name: "springGentle", desc: "260 / 25 — page transitions, modals", transition: springGentle },
      { kind: "spring", name: "springBouncy", desc: "200 / 22 — entry animations", transition: springBouncy },
      { kind: "spring", name: "springHeavy", desc: "300 / 30 — full-page transitions", transition: springHeavy },
      { kind: "spring", name: "springTab", desc: "500 / 40 — tab pill indicator", transition: springTab },
    ],
  },
  {
    label: "Enter / Exit",
    items: [
      { kind: "variant", name: "fadeUp", desc: "Fade + rise 16 px — auth, onboarding", variants: fadeUp },
      { kind: "variant", name: "fadeUpHero", desc: "Fade + rise 30 px — landing hero", variants: fadeUpHero },
      { kind: "variant", name: "fadeIn", desc: "Fade only — overlays, backdrops", variants: fadeIn },
      { kind: "variant", name: "slideUpSmall", desc: "Fade + rise 8 px — form steps", variants: slideUpSmall },
      { kind: "variant", name: "slideInLeft", desc: "Slide from left — mobile drawer", variants: slideInLeft },
      { kind: "variant", name: "slideInRight", desc: "Slide from right — side sheets", variants: slideInRight },
      { kind: "variant", name: "messageVariants", desc: "Chat bubble — up from below", variants: messageVariants },
    ],
  },
  {
    label: "Page",
    items: [
      { kind: "variant", name: "pageVariants", desc: "Full-page enter/exit — small y offset", variants: pageVariants },
      { kind: "variant", name: "tabVariants", desc: "Horizontal slide — tab content", variants: tabVariants },
    ],
  },
  {
    label: "Stagger",
    items: [
      { kind: "stagger", name: "staggerContainer", desc: "60 ms — quick chips", container: staggerContainer, item: staggerItem },
      { kind: "stagger", name: "staggerContainerSlow", desc: "150 ms — landing hero", container: staggerContainerSlow, item: staggerItem },
      { kind: "card-stagger", name: "cardStagger", desc: "80 ms per index — feed / scroll cards" },
    ],
  },
  {
    label: "Interactive",
    items: [
      { kind: "interactive", name: "tapScale", desc: "Scale 0.9 on press", motionProps: tapScale, hint: "tap" },
      { kind: "interactive", name: "hoverLift", desc: "Rise 6 px on hover", motionProps: hoverLift, hint: "hover" },
      { kind: "interactive", name: "hoverLiftSlight", desc: "Rise 4 px on hover", motionProps: hoverLiftSlight, hint: "hover" },
      { kind: "interactive", name: "hoverScale", desc: "Scale 1.04 on hover", motionProps: hoverScale, hint: "hover" },
    ],
  },
  {
    label: "Special",
    items: [
      { kind: "spinner", name: "spinnerTransition", desc: "Infinite rotation — loading states" },
    ],
  },
];

// ─── Stage (large preview) ────────────────────────────────────────────────

const STAGE_BOX = "h-14 w-14 rounded-card bg-primary";

function Stage({ item, tick }: { item: VariantItem; tick: number }) {
  if (item.kind === "spring") {
    return (
      <div className="flex items-center justify-center">
        <motion.div
          key={tick}
          initial={{ x: -48, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={item.transition}
          className={STAGE_BOX}
        />
      </div>
    );
  }

  if (item.kind === "variant") {
    return (
      <div className="flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tick}
            variants={item.variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={STAGE_BOX}
          />
        </AnimatePresence>
      </div>
    );
  }

  if (item.kind === "stagger") {
    return (
      <div className="flex items-center justify-center gap-3">
        <motion.div
          key={tick}
          variants={item.container}
          initial="hidden"
          animate="visible"
          className="flex gap-3"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i} variants={item.item} className={STAGE_BOX} />
          ))}
        </motion.div>
      </div>
    );
  }

  if (item.kind === "card-stagger") {
    return (
      <div className="flex items-center justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`${tick}-${i}`}
            variants={cardStagger}
            initial="hidden"
            animate="visible"
            custom={i}
            className={STAGE_BOX}
          />
        ))}
      </div>
    );
  }

  if (item.kind === "interactive") {
    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div
          {...item.motionProps}
          className={`${STAGE_BOX} cursor-pointer`}
        />
        <p className="font-mono text-[10px] text-muted-foreground">
          {item.hint === "tap" ? "tap / click the box" : "hover over the box"}
        </p>
      </div>
    );
  }

  if (item.kind === "spinner") {
    return (
      <div className="flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={spinnerTransition}
          className="h-14 w-14 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return null;
}

// ─── Row item ─────────────────────────────────────────────────────────────

function VariantRow({
  item,
  active,
  onSelect,
}: {
  item: VariantItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-button px-2 py-2 text-left transition-colors ${
        active
          ? "bg-primary/10 text-foreground"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
          active ? "bg-primary" : "bg-border"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[11px] font-medium leading-tight text-foreground">
          {item.name}
        </p>
        <p className="truncate font-sans text-[10px] leading-tight text-muted-foreground">
          {item.desc}
        </p>
      </div>
      {active && (
        <span className="shrink-0 font-mono text-[10px] text-primary">
          ▶
        </span>
      )}
    </button>
  );
}

// ─── Group ────────────────────────────────────────────────────────────────

function AnimationGroup({
  group,
  activeItem,
  onSelect,
}: {
  group: Group;
  activeItem: VariantItem | null;
  onSelect: (item: VariantItem) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        {group.label}
        <span>{open ? "▾" : "▸"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 px-2 pb-2">
              {group.items.map((item) => (
                <VariantRow
                  key={item.name}
                  item={item}
                  active={activeItem?.name === item.name}
                  onSelect={() => onSelect(item)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export function AnimationPreview() {
  const prefersReducedMotion = useSafeReducedMotion();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<VariantItem>(GROUPS[0].items[0]);
  const [tick, setTick] = useState(0);

  if (process.env.NODE_ENV !== "development") return null;

  function selectItem(item: VariantItem) {
    setSelected(item);
    setTick((t) => t + 1);
  }

  const isInteractive = selected.kind === "interactive" || selected.kind === "spinner";

  return (
    <>
      {/* Floating toggle */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        {...(prefersReducedMotion ? {} : tapScale)}
        className="fixed bottom-4 right-4 z-[9000] flex h-10 w-10 items-center justify-center rounded-button bg-ink text-cream shadow-md transition-colors hover:bg-ink/80"
        aria-label={open ? "Close animation preview" : "Open animation preview"}
        title="Animation Preview (dev only)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[8999]"
              aria-hidden="true"
            />

            <motion.aside
              key="panel"
              initial={prefersReducedMotion ? false : { x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={prefersReducedMotion ? {} : { x: 320, opacity: 0 }}
              transition={springGentle}
              className="fixed bottom-0 right-0 top-0 z-[9000] flex w-72 flex-col border-l border-border bg-card shadow-xl"
              aria-label="Animation preview panel"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
                <div>
                  <p className="font-sans text-sm font-semibold text-foreground">
                    Animations
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    @/lib/motion-variants · dev only
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-button text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Stage */}
              <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-4">
                <div className="mb-3 flex min-h-[72px] items-center justify-center rounded-card border border-dashed border-border bg-card px-4 py-4">
                  <Stage item={selected} tick={tick} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] font-semibold text-foreground">
                      {selected.name}
                    </p>
                    <p className="truncate font-sans text-[10px] text-muted-foreground">
                      {selected.desc}
                    </p>
                  </div>
                  {!isInteractive && (
                    <button
                      onClick={() => setTick((t) => t + 1)}
                      className="shrink-0 rounded-button border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-foreground transition-colors hover:bg-muted"
                    >
                      ↺ Play again
                    </button>
                  )}
                </div>
              </div>

              {/* Variant list */}
              <div className="flex-1 overflow-y-auto">
                {GROUPS.map((group) => (
                  <AnimationGroup
                    key={group.label}
                    group={group}
                    activeItem={selected}
                    onSelect={selectItem}
                  />
                ))}
              </div>

              <div className="shrink-0 border-t border-border px-3 py-2">
                <p className="font-sans text-[10px] text-muted-foreground">
                  Click any row to preview · ↺ to replay
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

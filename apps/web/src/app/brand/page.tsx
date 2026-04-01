import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";

import {
  BrandConcentricArch,
  BrandLogo,
  BrandStar,
  BrandSunburst,
} from "@/components/brand";
import { ROUTES } from "@kurate/utils";

export const metadata: Metadata = {
  title: "Brand guidelines | Kurate",
  description:
    "Colors, typography, shapes, and logo usage for Kurate — for design, motion, and video production.",
  openGraph: {
    title: "Brand guidelines | Kurate",
    description:
      "Colors, typography, shapes, and logo usage for Kurate — for design, motion, and video production.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kurate — Read smarter, curate better",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
};

function Swatch({
  className,
  label,
  hex,
  note,
}: {
  className: string;
  label: string;
  hex: string;
  note: string;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
      <div className={`h-20 w-full ${className}`} aria-hidden />
      <div className="space-y-1 p-3">
        <p className="font-sans text-sm font-semibold text-foreground">{label}</p>
        <p className="font-mono text-xs text-muted-foreground">{hex}</p>
        <p className="font-sans text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

function AssetDownloadCard({
  title,
  svg,
  baseName,
  children,
}: {
  title: string;
  svg: string;
  baseName: string;
  children: React.ReactNode;
}) {
  const encoded = encodeURIComponent(svg);

  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-sm">
      <p className="font-mono text-xs text-muted-foreground">{title}</p>
      <div className="mt-4 flex min-h-16 items-center">{children}</div>
      <div className="mt-4 flex gap-2">
        <a
          href={`data:image/svg+xml;charset=utf-8,${encoded}`}
          download={`${baseName}.svg`}
          className="rounded-button bg-primary px-3 py-2 font-sans text-xs font-semibold text-primary-foreground"
        >
          Download SVG
        </a>
        <button
          type="button"
          data-download="png"
          data-filename={`${baseName}.png`}
          data-svg={encoded}
          className="rounded-button border border-border bg-card px-3 py-2 font-sans text-xs font-semibold text-foreground hover:bg-surface"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="88" viewBox="0 0 320 88" fill="none"><path d="M18 68V44C18 29 29 18 48 18C67 18 78 29 78 44V68" stroke="#143D60" stroke-width="5"/><path d="M31 68V48C31 38 38 31 48 31C58 31 65 38 65 48V68" stroke="#143D60" stroke-width="5"/><path d="M44 68V52C44 49 45.5 47.5 48 47.5C50.5 47.5 52 49 52 52V68" stroke="#143D60" stroke-width="5"/><text x="96" y="58" fill="#143D60" font-size="44" font-family="DM Sans, Arial, sans-serif" font-weight="900" letter-spacing="-0.8">Kurate</text></svg>`;

const archSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 48 36" fill="none"><path d="M6 36V20C6 12 12 6 24 6C36 6 42 12 42 20V36" stroke="#143D60" stroke-width="3"/><path d="M14 36V22C14 17 18 13 24 13C30 13 34 17 34 22V36" stroke="#143D60" stroke-width="3"/><path d="M21 36V25C21 23 22 22 24 22C26 22 27 23 27 25V36" stroke="#143D60" stroke-width="3"/></svg>`;

const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" fill="#143D60"/></svg>`;

const sunburstSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 48 48" fill="none" stroke="#143D60" stroke-width="1.5" stroke-linecap="round"><line x1="32" y1="24" x2="46" y2="24"/><line x1="30.928203" y1="28" x2="43.052559" y2="35"/><line x1="28" y1="30.928203" x2="35" y2="43.052559"/><line x1="24" y1="32" x2="24" y2="46"/><line x1="20" y1="30.928203" x2="13" y2="43.052559"/><line x1="17.071797" y1="28" x2="4.947441" y2="35"/><line x1="16" y1="24" x2="2" y2="24"/><line x1="17.071797" y1="20" x2="4.947441" y2="13"/><line x1="20" y1="17.071797" x2="13" y2="4.947441"/><line x1="24" y1="16" x2="24" y2="2"/><line x1="28" y1="17.071797" x2="35" y2="4.947441"/><line x1="30.928203" y1="20" x2="43.052559" y2="13"/></svg>`;

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-background">
      <main id="main-content" className="container-page py-10 md:py-14">
        <header className="mb-12 max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Kurate
          </p>
          <h1 className="mt-2 font-serif text-3xl text-ink md:text-4xl">Brand guidelines</h1>
          <p className="mt-3 font-sans text-base text-foreground">
            Reference for design, motion, and video. All colors are sRGB. Match the live product where
            possible.
          </p>
        </header>

        <section className="mb-14" aria-labelledby="colors-heading">
          <h2 id="colors-heading" className="mb-6 font-serif text-2xl text-ink">Color palette</h2>
          <h3 className="mb-3 font-sans text-sm font-semibold text-foreground">Surfaces</h3>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Swatch className="bg-background" label="Page background" hex="#F5F0E8" note="Warm cream — primary page fill" />
            <Swatch className="bg-surface" label="Raised surface" hex="#FAF7F2" note="Sections, sidebars, tab areas" />
            <Swatch className="bg-card" label="Card / input" hex="#FFFFFF" note="Cards, inputs, modals" />
          </div>
          <h3 className="mb-3 font-sans text-sm font-semibold text-foreground">Text</h3>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Swatch className="bg-ink" label="Ink / headings" hex="#143D60" note="Logotype, headings, max contrast" />
            <Swatch className="bg-foreground" label="Body" hex="#2B5B7E" note="Default body and UI copy" />
            <Swatch className="bg-muted-foreground" label="Muted" hex="#5B7D99" note="Captions, secondary text" />
          </div>
          <h3 className="mb-3 font-sans text-sm font-semibold text-foreground">Brand green</h3>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Swatch className="bg-primary" label="Primary" hex="#1A5C4B" note="CTAs, active states — pair with white text" />
            <Swatch className="bg-brand-50" label="Brand 50" hex="#EAF3EF" note="Soft fills, tab backgrounds" />
            <Swatch className="bg-brand-100" label="Brand 100" hex="#C5DDD4" note="Hover, badges" />
            <Swatch className="bg-brand-200" label="Brand 200" hex="#8BBDAE" note="Decorative accents" />
          </div>
        </section>

        <section className="mb-14" aria-labelledby="type-heading">
          <h2 id="type-heading" className="mb-6 font-serif text-2xl text-ink">Typography</h2>
          <div className="space-y-6 rounded-card border border-border bg-card p-6 shadow-sm">
            <div>
              <p className="font-mono text-xs text-muted-foreground">DM Sans · weights</p>
              <p className="mt-2 font-sans text-lg font-normal text-foreground">Regular 400 — The quick brown fox</p>
              <p className="font-sans text-lg font-medium text-foreground">Medium 500 — The quick brown fox</p>
              <p className="font-sans text-lg font-semibold text-foreground">Semibold 600 — The quick brown fox</p>
              <p className="font-sans text-lg font-bold text-foreground">Bold 700 — The quick brown fox</p>
              <p className="font-sans text-lg font-black text-ink">Black 900 — Kurate logotype weight</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">DM Mono · 400</p>
              <p className="mt-2 font-mono text-sm text-foreground">saved_at 2026-04-01T14:32:00Z · metadata line</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">Georgia · headlines</p>
              <p className="mt-2 font-serif text-2xl text-ink">Editorial headline in Georgia</p>
            </div>
          </div>
        </section>

        <section className="mb-14" aria-labelledby="logo-heading">
          <h2 id="logo-heading" className="mb-6 font-serif text-2xl text-ink">Logo and motifs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <AssetDownloadCard title="Wordmark + arch" svg={logoSvg} baseName="kurate-logo">
              <BrandLogo name="Kurate" s={32} />
            </AssetDownloadCard>
            <AssetDownloadCard title="Arch mark" svg={archSvg} baseName="kurate-arch">
              <BrandConcentricArch s={56} className="text-ink" />
            </AssetDownloadCard>
            <AssetDownloadCard title="Star motif" svg={starSvg} baseName="kurate-star">
              <BrandStar s={44} className="text-ink" />
            </AssetDownloadCard>
            <AssetDownloadCard title="Sunburst motif" svg={sunburstSvg} baseName="kurate-sunburst">
              <BrandSunburst s={48} className="text-ink" />
            </AssetDownloadCard>
          </div>
        </section>

        <section className="mb-12" aria-labelledby="video-heading">
          <h2 id="video-heading" className="mb-6 font-serif text-2xl text-ink">Video and motion</h2>
          <ul className="max-w-2xl list-disc space-y-2 pl-5 font-sans text-sm text-foreground">
            <li>Prefer cream (#F5F0E8) or white (#FFFFFF) backgrounds for UI screen recordings and titles.</li>
            <li>Use primary green (#1A5C4B) for CTAs and emphasis — white text on green for buttons.</li>
            <li>Body copy at #2B5B7E; headings and logo at #143D60.</li>
            <li>Keep shadows soft and slightly blue-tinted if you composite fake cards or panels.</li>
            <li>You can print this page to PDF from the browser for an offline reference.</li>
          </ul>
        </section>

        <footer className="border-t border-border pt-8">
          <Link href={ROUTES.HOME} className="font-sans text-sm font-medium text-primary hover:underline">
            Back to home
          </Link>
        </footer>
      </main>

      <Script id="brand-png-downloads" strategy="afterInteractive">
        {`(() => {
          const decode = (value) => decodeURIComponent(value || "");

          const triggerDownload = (url, filename) => {
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
          };

          const onClick = async (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const button = target.closest('button[data-download="png"]');
            if (!(button instanceof HTMLButtonElement)) return;

            const encodedSvg = button.dataset.svg || "";
            const filename = button.dataset.filename || "asset.png";
            const svg = decode(encodedSvg);
            if (!svg) return;

            const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);

            try {
              const img = new Image();
              img.crossOrigin = "anonymous";
              await new Promise((resolve, reject) => {
                img.onload = () => resolve(true);
                img.onerror = () => reject(new Error("Image load failed"));
                img.src = url;
              });

              const canvas = document.createElement("canvas");
              const scale = 2;
              canvas.width = Math.max(1, img.width * scale);
              canvas.height = Math.max(1, img.height * scale);

              const ctx = canvas.getContext("2d");
              if (!ctx) return;

              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              const pngUrl = canvas.toDataURL("image/png");
              triggerDownload(pngUrl, filename);
            } catch (error) {
              console.error("PNG export failed", error);
            } finally {
              URL.revokeObjectURL(url);
            }
          };

          document.addEventListener("click", onClick);
        })();`}
      </Script>
    </div>
  );
}

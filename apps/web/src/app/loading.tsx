import { BrandConcentricArch } from "@/components/brand";

export default function LoadingHomePage() {
  return (
    <section
      className="bg-background flex h-dvh w-full items-center justify-center"
      role="status"
      aria-label="Loading content"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-ink/40">
          <BrandConcentricArch s={36} />
        </div>
        <span className="font-sans text-sm font-black tracking-tight text-ink/30">Kurate</span>
        <span className="sr-only">Loading, please wait...</span>
      </div>
    </section>
  );
}

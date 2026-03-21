import { BrandSunburst, FloatDeco } from "@/components/brand";

interface AuthPageShellProps {
  children: React.ReactNode;
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div aria-hidden="true">
        <FloatDeco top={50} right={50} opacity={0.04}>
          <BrandSunburst s={100} />
        </FloatDeco>
      </div>
      <main id="main-content" className="max-w-auth relative z-10 w-full px-8">
        {children}
      </main>
    </div>
  );
}

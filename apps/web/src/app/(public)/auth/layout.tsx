import type { Metadata } from "next";
import { BfcacheGuard } from "./_components/bfcache-guard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BfcacheGuard />
      {children}
    </>
  );
}

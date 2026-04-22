import type { Metadata } from "next";
import { AdminNav } from "@/app/(admin)/_components/admin-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background sm:flex-row">
      <AdminNav />
      <main id="main-content" className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

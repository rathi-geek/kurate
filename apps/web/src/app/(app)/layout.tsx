import { AuthProvider } from "@/app/_libs/auth-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}

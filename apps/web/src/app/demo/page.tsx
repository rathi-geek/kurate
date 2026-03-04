import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-serif text-foreground mb-4">Watch in action</h1>
        <p className="text-muted-foreground mb-6">Demo coming soon.</p>
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

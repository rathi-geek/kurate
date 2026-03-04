import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-serif text-foreground mb-4">Blog</h1>
        <p className="text-muted-foreground mb-6">Coming soon.</p>
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

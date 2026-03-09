"use client";

const INTEREST_TAGS = ["Product", "Startups", "AI", "Psychology"];

const MOCK_PROFILE_STATS = [
  { label: "Saved", value: 142 },
  { label: "Read", value: 89 },
  { label: "Shared", value: 47 },
  { label: "Following", value: 23 },
  { label: "Trust Score", value: 94 },
];

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
        Profile
      </p>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold rounded-full">
          V
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Vivek Kamath</h1>
            <button className="text-xs px-3 py-1.5 border rounded-full hover:bg-accent transition-colors">
              Edit
            </button>
          </div>
          <p className="font-mono text-sm text-muted-foreground mb-2">
            @vivek
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Product-minded builder. Curating the things that shape how I think.
          </p>

          <div className="flex gap-2 flex-wrap">
            {INTEREST_TAGS.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-8">
        {MOCK_PROFILE_STATS.map((stat) => (
          <div key={stat.label} className="text-center py-4 bg-card border rounded-xl">
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="font-mono text-xs text-muted-foreground uppercase mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Your Week
        </p>
        <div className="grid grid-cols-3 gap-4 p-5 bg-card border rounded-card">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">12</div>
            <div className="font-mono text-xs text-muted-foreground uppercase mt-1">Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">8</div>
            <div className="font-mono text-xs text-muted-foreground uppercase mt-1">Read</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate">5</div>
            <div className="font-mono text-xs text-muted-foreground uppercase mt-1">Shared</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Content DNA
        </p>
        <div className="bg-card border rounded-card p-6">
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Content DNA Chart (Coming Soon)
          </div>
        </div>
      </div>
    </div>
  );
}

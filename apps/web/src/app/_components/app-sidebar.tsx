"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrandStar,
  BrandConcentricArch,
} from "@/components/brand";
import { MOCK_CONTACTS, MOCK_GROUPS } from "@/app/_libs/contacts";

const NAV_ITEMS = [
  { href: "/chat", label: "Home", icon: "home" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/shared", label: "Shared", icon: "shared" },
] as const;

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SharedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  profile: ProfileIcon,
  shared: SharedIcon,
};

interface AppSidebarProps {
  userEmail?: string;
  onLogout?: () => void;
}

export function AppSidebar({ userEmail, onLogout }: AppSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/chat") return pathname === "/chat" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="shrink-0 w-64 bg-background border-r border-border hidden md:flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-5">
        <BrandConcentricArch s={22} className="text-foreground" />
        <span className="font-bold text-lg text-foreground">
          Kurate
        </span>
      </div>

      <div className="px-4 mb-4">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = isActive(href);
            const Icon = ICONS[icon];
            return (
              <Link
                key={href}
                href={href as never}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                  active ? "bg-accent" : ""
                }`}
                style={{ borderRadius: 8 }}
              >
                <Icon className={`w-5 h-5 ${active ? "text-foreground" : "text-muted-foreground"}`} />
                <span className={`font-medium text-sm ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-4 border-t border-border mb-4" />

      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          People
        </p>
        <div className="space-y-1">
          {MOCK_CONTACTS.slice(0, 5).map((person) => (
            <button
              key={person.handle}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors cursor-pointer text-left"
              style={{ borderRadius: 8 }}
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold rounded-full">
                  {person.name[0]}
                </div>
                {person.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-foreground truncate">{person.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{person.handle}</div>
              </div>
            </button>
          ))}
        </div>

        <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mt-6 mb-3">
          Groups
        </p>
        <div className="space-y-1">
          {MOCK_GROUPS.slice(0, 4).map((group) => (
            <Link
              key={group.slug}
              href={`/groups/${group.slug}` as never}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors cursor-pointer text-left"
              style={{ borderRadius: 8 }}
            >
              <div
                className="w-8 h-8 flex items-center justify-center shrink-0"
                style={{ borderRadius: 8, backgroundColor: `${group.color}20` }}
              >
                <BrandStar s={12} className={group.color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-foreground truncate">{group.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{group.members} members</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        {userEmail && (
          <div className="font-mono text-xs text-muted-foreground truncate mb-2">
            {userEmail}
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors cursor-pointer"
          style={{ borderRadius: 8 }}
        >
          <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="font-medium text-sm text-muted-foreground">Log out</span>
        </button>
      </div>
    </div>
  );
}

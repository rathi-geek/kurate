"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@kurate/utils";
import { useTranslations } from "@/i18n/use-translations";
import { cn } from "@/app/_libs/utils/cn";

const NAV_ITEMS = [
  { href: ROUTES.ADMIN.DASHBOARD, key: "dashboard" as const },
  { href: ROUTES.ADMIN.USERS, key: "users" as const },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  return (
    <nav
      aria-label="Admin navigation"
      className="flex w-52 shrink-0 flex-col border-r border-border bg-surface px-3 py-6"
    >
      <div className="mb-6 font-serif text-lg font-semibold text-ink">
        {t("brand")}
      </div>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, key }) => {
          const isActive =
            href === ROUTES.ADMIN.DASHBOARD
              ? pathname === ROUTES.ADMIN.DASHBOARD
              : pathname.startsWith(href);
          return (
            <li key={key}>
              <Link
                href={href}
                className={cn(
                  "block rounded-button px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-brand-50 hover:text-foreground"
                )}
              >
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Serif title + muted subtitle used at the top of auth and app pages.
 *
 * Usage:
 * ```tsx
 * <PageHeader title={t("title")} subtitle={t("subtitle")} />
 * ```
 */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{title}</h2>
      {subtitle && <p className="text-muted-foreground mb-8 font-sans text-sm">{subtitle}</p>}
    </div>
  );
}

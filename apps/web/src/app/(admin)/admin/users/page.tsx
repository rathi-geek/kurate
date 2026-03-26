import { getT } from "@/i18n/server";

export default async function AdminUsersPage() {
  const t = getT("admin.users");
  return (
    <div className="container-page space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-ink">
        {t("title")}
      </h1>
      <p className="font-sans text-sm text-muted-foreground">
        {t("subtitle")}
      </p>
    </div>
  );
}

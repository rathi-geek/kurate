import { getTranslations } from "next-intl/server";
import { AdminDashboardStats } from "../../_components/admin-dashboard-stats";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  return (
    <div className="container-page space-y-8">
      <h1 className="font-serif text-2xl font-semibold text-ink">
        {t("title")}
      </h1>
      <AdminDashboardStats />
    </div>
  );
}

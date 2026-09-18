import { TodayDashboard } from "@/features/dashboard/today-dashboard";
import { getTodayDashboardView } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const view = await getTodayDashboardView();
  return <TodayDashboard view={view} />;
}

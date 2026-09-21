import { TodayDashboard } from "@/features/dashboard/today-dashboard";
import { getTodayDashboardView } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const view = await getTodayDashboardView().catch((error: unknown) => {
    console.error("Failed to load today dashboard", error);
    return null;
  });

  return <TodayDashboard view={view} />;
}

import { TodayDashboard } from "@/features/dashboard/today-dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/dashboard/summary`, { cache: "no-store" });

  if (!response.ok) {
    return <TodayDashboard view={null} />;
  }

  const payload = await response.json();
  return <TodayDashboard view={payload.data ?? null} />;
}

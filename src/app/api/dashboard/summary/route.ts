import { NextResponse } from "next/server";
import { getTodayDashboardView } from "@/services/dashboard.service";

export async function GET() {
  const data = await getTodayDashboardView();
  return NextResponse.json({ data });
}

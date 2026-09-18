import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDataSource } from "@/db/data-source";
import { User } from "@/entities";
import { getTodayKpis } from "@/services/dashboard.service";
import { notify } from "@/services/notifications.service";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dataSource = await getDataSource();
  const activeUsers = await dataSource.getRepository(User).find({ where: { active: true }, select: { id: true } });
  const kpis = await getTodayKpis();

  await notify(
    activeUsers.map((user) => user.id),
    "weekly-digest",
    {
      title: "Your weekly Bekur digest",
      body: `${kpis.callsThisWeek} calls logged this week, ${kpis.contactRate}% contact rate, ${currency.format(kpis.revenueWon)} revenue won all-time.`,
      url: "/",
    },
  );

  return NextResponse.json({ notified: activeUsers.length });
}

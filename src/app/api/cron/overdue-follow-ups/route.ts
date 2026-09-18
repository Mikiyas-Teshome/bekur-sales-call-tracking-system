import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOverdueLeadsByAssignee } from "@/services/dashboard.service";
import { notify } from "@/services/notifications.service";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdueByUser = await getOverdueLeadsByAssignee();

  await Promise.all(
    overdueByUser.map((row) =>
      notify([row.userId], "overdue", {
        title: "Overdue follow-ups",
        body: `You have ${row.count} lead${row.count === 1 ? "" : "s"} with an overdue follow-up.`,
        url: "/leads",
      }),
    ),
  );

  return NextResponse.json({ notified: overdueByUser.length });
}

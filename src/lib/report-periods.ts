export const reportPeriods = ["This month", "Last 30 days", "This quarter", "Year to date"] as const;
export type ReportPeriod = (typeof reportPeriods)[number];

export type DateRange = { from: Date; to: Date; previousFrom: Date; previousTo: Date };

export function isReportPeriod(value: string): value is ReportPeriod {
  return (reportPeriods as readonly string[]).includes(value);
}

export function resolvePeriodRange(period: ReportPeriod, now = new Date()): DateRange {
  const to = new Date(now);
  let from: Date;

  if (period === "This month") from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === "Last 30 days") from = new Date(now.getTime() - 30 * 86_400_000);
  else if (period === "This quarter") from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  else from = new Date(now.getFullYear(), 0, 1);

  const length = to.getTime() - from.getTime();
  return { from, to, previousFrom: new Date(from.getTime() - length), previousTo: new Date(from.getTime()) };
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthKeyRange(key: string) {
  const [year, month] = key.split("-").map(Number);
  return { from: new Date(year, month - 1, 1), to: new Date(year, month, 1) };
}

export function isMonthKey(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthKeyLabel(key: string) {
  const { from } = monthKeyRange(key);
  return from.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

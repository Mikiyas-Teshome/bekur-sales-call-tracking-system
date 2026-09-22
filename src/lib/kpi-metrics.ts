export const kpiMetrics = [
  { key: "calls", label: "Calls made", kind: "count" },
  { key: "contacts", label: "Leads reached", kind: "count" },
  { key: "demos", label: "Demos booked", kind: "count" },
  { key: "dealsWon", label: "Deals won", kind: "count" },
  { key: "revenue", label: "Revenue won", kind: "currency" },
] as const;

export type KpiMetricKey = (typeof kpiMetrics)[number]["key"];
export type KpiValues = Record<KpiMetricKey, number>;

export const emptyKpiValues = (): KpiValues => ({ calls: 0, contacts: 0, demos: 0, dealsWon: 0, revenue: 0 });

export function sumKpiValues(values: Iterable<KpiValues>): KpiValues {
  const total = emptyKpiValues();
  for (const entry of values) {
    for (const metric of kpiMetrics) total[metric.key] += entry[metric.key];
  }
  return total;
}

export function attainment(actual: number, target: number) {
  if (target <= 0) return null;
  return Math.round((actual / target) * 100);
}

export function hasAnyTarget(values: KpiValues) {
  return kpiMetrics.some((metric) => values[metric.key] > 0);
}

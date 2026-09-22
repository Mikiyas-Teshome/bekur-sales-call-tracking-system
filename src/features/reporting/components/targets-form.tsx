"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { emptyKpiValues, kpiMetrics, type KpiMetricKey, type KpiValues } from "@/lib/kpi-metrics";
import { monthKey, monthKeyLabel } from "@/lib/report-periods";
import { getKpiTargetsAction, saveKpiTargetsAction } from "@/actions/kpi";

const inputClass = "mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function TargetsForm({ userCode, userName, initialPeriod, onSaved }: { userCode: string; userName: string; initialPeriod?: string; onSaved?: () => void }) {
  const [period, setPeriod] = useState(initialPeriod ?? monthKey());
  const [values, setValues] = useState<KpiValues>(emptyKpiValues());
  const [loadedPeriod, setLoadedPeriod] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const loading = loadedPeriod !== period;

  useEffect(() => {
    let cancelled = false;
    getKpiTargetsAction({ userCode, period }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
      } else {
        setValues(result.values);
        setExists(result.exists);
      }
      setLoadedPeriod(period);
    });
    return () => {
      cancelled = true;
    };
  }, [userCode, period]);

  const changePeriod = (next: string) => {
    setPeriod(next || monthKey());
    setSaved(false);
    setError(null);
  };

  const update = (key: KpiMetricKey, raw: string) => {
    const next = Number(raw);
    setValues((current) => ({ ...current, [key]: Number.isFinite(next) && next >= 0 ? next : 0 }));
    setSaved(false);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveKpiTargetsAction({ userCode, period, values });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setExists(true);
      router.refresh();
      onSaved?.();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
          <Target className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{userName}</p>
          <p className="truncate text-xs text-muted-foreground">{exists ? `Targets set for ${monthKeyLabel(period)}` : `No targets yet for ${monthKeyLabel(period)}`}</p>
        </div>
      </div>
      <label className="block text-sm font-bold">
        Month
        <input type="month" value={period} onChange={(event) => changePeriod(event.target.value)} className={inputClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {kpiMetrics.map((metric) =>
          loading ? (
            <div key={metric.key}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-11 w-full rounded-full" />
            </div>
          ) : (
            <label key={metric.key} className="block text-sm font-bold">
              {metric.label}
              <input type="number" inputMode={metric.kind === "currency" ? "decimal" : "numeric"} min={0} step={metric.kind === "currency" ? 100 : 1} value={values[metric.key] || ""} onChange={(event) => update(metric.key, event.target.value)} placeholder="0" className={cn(inputClass, "tabular-nums")} />
            </label>
          ),
        )}
      </div>
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
      {saved && !error ? <p className="text-sm font-semibold text-success">Targets saved.</p> : null}
      <button type="button" disabled={pending || loading} onClick={submit} className={cn(primaryPillClass, "h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-50")}>
        <Check className="size-4" strokeWidth={2.25} />
        {pending ? "Saving…" : "Save targets"}
      </button>
    </div>
  );
}

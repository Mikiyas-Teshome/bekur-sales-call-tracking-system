"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Download, LineChart, Lock, Minus, Target, TrendingUp, UsersRound } from "lucide-react";
import { FilterMenu } from "@/components/shared/filter-menu";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { chipClass, softPillClass, toneChipClasses } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { useRolePreview } from "@/components/shared/role-preview";
import { hasPermission } from "@/lib/permissions";
import { useSearchParamsUpdater } from "@/lib/use-search-params-updater";
import { reportPeriods } from "@/lib/report-periods";
import type { ReportPerson, ReportsView } from "@/services/reports.service";
import { SetTargetsDialog, type TargetPerson } from "./components/set-targets-dialog";

const reportTabs = ["Overview", "Conversion", "Team performance"] as const;
type ReportTab = (typeof reportTabs)[number];

const tabInsights: Record<ReportTab, { title: string; detail: string; icon: typeof TrendingUp }> = {
  Overview: { title: "Executive overview", detail: "Revenue, pipeline health, source efficiency, and target progress in one operating view.", icon: TrendingUp },
  Conversion: { title: "Conversion analysis", detail: "Find where leads move forward, where they stall, and which outcomes need coaching.", icon: Target },
  "Team performance": { title: "Team performance", detail: "Compare call activity, contact rate, wins, revenue, and monthly target attainment per person.", icon: UsersRound },
};

const heatmapTones = ["bg-muted", "bg-chart-5", "bg-chart-2", "bg-chart-1"];
const categoricalTones = ["bg-chart-1", "bg-chart-3", "bg-chart-4", "bg-chart-2", "bg-chart-5"];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const everyoneOption = "Everyone";

type Filters = { period: string; person: string };

function formatMetric(kind: "count" | "currency", value: number) {
  return kind === "currency" ? currency.format(value) : value.toLocaleString("en-US");
}

function attainmentTone(value: number | null) {
  if (value === null) return "muted";
  if (value >= 100) return "success";
  if (value >= 50) return "primary";
  return "warning";
}

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
        <Minus className="size-3.5" strokeWidth={2.25} />
        no prior data
      </span>
    );
  }
  const positive = delta >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold", positive ? "text-success" : "text-destructive")}>
      <Icon className="size-3.5" strokeWidth={2.25} />
      {positive ? "+" : ""}
      {delta}%
    </span>
  );
}

function CardEmpty({ icon: Icon, title, description }: { icon: typeof Target; title: string; description: string }) {
  return (
    <div className="grid min-h-40 place-items-center text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <p className="mt-3 text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function buildCsv(view: ReportsView) {
  const escape = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines: string[] = [];
  lines.push(["Report", view.period, view.rangeLabel, view.scopeLabel].map(escape).join(","));
  lines.push("");
  lines.push(["Metric", "Value", "Change vs previous"].map(escape).join(","));
  for (const item of view.summary) lines.push([item.label, item.value, item.delta === null ? "" : `${item.delta}%`].map(escape).join(","));
  lines.push("");
  lines.push(["Person", "Role", "Calls", "Contact rate", "Won", "Revenue", "Month target attainment"].map(escape).join(","));
  for (const row of view.leaderboard) lines.push([row.name, row.role, row.calls, row.contactRate === null ? "" : `${row.contactRate}%`, row.won, row.revenue, row.monthAttainment === null ? "" : `${row.monthAttainment}%`].map(escape).join(","));
  lines.push("");
  lines.push(["Campaign", "Project", "Leads", "Calls", "Won", "Revenue", "ROAS"].map(escape).join(","));
  for (const row of view.campaigns) lines.push([row.name, row.project, row.leads, row.calls, row.won, row.revenue, row.roas === null ? "" : `${row.roas}x`].map(escape).join(","));
  return lines.join("\n");
}

export function ReportsWorkspace({ view, people, filters }: { view: ReportsView; people: ReportPerson[]; filters: Filters }) {
  const { effectivePermissions, effectiveRoleName } = useRolePreview();
  const canSeeTeam = hasPermission(effectivePermissions, "reports:view_team");
  const canManageTargets = hasPermission(effectivePermissions, "kpi:manage_targets");
  const updateParams = useSearchParamsUpdater();
  const visibleTabs = reportTabs.filter((tab) => tab !== "Team performance" || canSeeTeam);
  const [requestedTab, setActiveTab] = useState<ReportTab>("Overview");
  const activeTab = visibleTabs.includes(requestedTab) ? requestedTab : visibleTabs[0];
  const [targetPerson, setTargetPerson] = useState<TargetPerson | null>(null);

  const personOptions = useMemo(() => {
    const seen = new Map<string, number>();
    const labels = people.map((person) => {
      const count = seen.get(person.name) ?? 0;
      seen.set(person.name, count + 1);
      return { code: person.code, label: count ? `${person.name} (${person.code})` : person.name };
    });
    return { list: [everyoneOption, ...labels.map((entry) => entry.label)], byLabel: new Map(labels.map((entry) => [entry.label, entry.code])), byCode: new Map(labels.map((entry) => [entry.code, entry.label])) };
  }, [people]);

  const personValue = personOptions.byCode.get(filters.person) ?? everyoneOption;
  const selectedPerson = people.find((person) => person.code === filters.person) ?? null;
  const insight = tabInsights[activeTab];
  const InsightIcon = insight.icon;

  const exportCsv = () => {
    const blob = new Blob([buildCsv(view)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bekur-report-${view.period.toLowerCase().replaceAll(" ", "-")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Performance intelligence</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Reports & analysis</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {view.rangeLabel} · {view.scopeLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterMenu label="Period" value={filters.period} options={reportPeriods} onChange={(value) => updateParams({ period: value === "This month" ? null : value })} widthClassName="max-w-40" />
          {canSeeTeam && people.length ? <FilterMenu label="Person" value={personValue} options={personOptions.list} onChange={(value) => updateParams({ person: value === everyoneOption ? null : (personOptions.byLabel.get(value) ?? null) })} icon={UsersRound} widthClassName="max-w-48" /> : null}
          <button type="button" onClick={exportCsv} className={cn(softPillClass, "h-11 px-4 text-sm")}>
            <Download className="size-4" strokeWidth={1.75} />
            Export report
          </button>
        </div>
      </section>

      <div className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1 scrollbar-none">
        <div className="flex min-w-max gap-1">
          {visibleTabs.map((tab) => (
            <button type="button" key={tab} aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} className={cn("h-9 rounded-full px-4 text-xs font-semibold transition-colors", activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <Surface className="flex items-center gap-3 bg-accent/60">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
          <InsightIcon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{insight.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</p>
        </div>
      </Surface>

      {activeTab === "Overview" ? (
        <>
          <SummaryTiles view={view} />
          <RevenueHero view={view} />
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
            <FunnelCard view={view} />
            <OutcomesCard view={view} />
          </section>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
            <CampaignTable view={view} mode="efficiency" />
            <TargetsCard view={view} person={selectedPerson} canManage={canManageTargets} onSetTargets={setTargetPerson} />
          </section>
        </>
      ) : null}

      {activeTab === "Conversion" ? (
        <>
          <ConversionTiles view={view} />
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
            <StageConversionCard view={view} />
            <OutcomesCard view={view} />
          </section>
          <CampaignTable view={view} mode="conversion" />
        </>
      ) : null}

      {activeTab === "Team performance" ? (
        canSeeTeam ? (
          <>
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
              <LeaderboardCard view={view} canManage={canManageTargets} onSetTargets={setTargetPerson} />
              <div className="space-y-4 lg:space-y-5">
                <TargetsCard view={view} person={selectedPerson} canManage={canManageTargets} onSetTargets={setTargetPerson} />
                <HeatmapCard view={view} />
              </div>
            </section>
          </>
        ) : (
          <Surface className="p-0">
            <PagePlaceholder icon={Lock} title="Team data restricted" description={`Team leaderboard and activity heatmap are limited to administrators and sales managers. You're previewing as ${effectiveRoleName}.`} />
          </Surface>
        )
      ) : null}

      <SetTargetsDialog person={targetPerson} open={targetPerson !== null} onOpenChange={(open) => (open ? null : setTargetPerson(null))} initialPeriod={view.targets.monthKey} />
    </div>
  );
}

function SummaryTiles({ view }: { view: ReportsView }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {view.summary.map((metric) => (
        <Surface key={metric.label} className="p-4">
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="text-[32px] leading-none font-bold tracking-tight">{metric.value}</p>
            <DeltaChip delta={metric.delta} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
        </Surface>
      ))}
    </section>
  );
}

function RevenueHero({ view }: { view: ReportsView }) {
  const points = view.revenueTrend;
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);
  const maxLeads = Math.max(...points.map((point) => point.leads), 1);
  const x = (index: number) => (points.length > 1 ? (index / (points.length - 1)) * 100 : 50);
  const revenueLine = points.map((point, index) => `${x(index)},${100 - (point.revenue / maxRevenue) * 100}`).join(" ");
  const leadLine = points.map((point, index) => `${x(index)},${100 - (point.leads / maxLeads) * 100}`).join(" ");
  const peakIndex = points.reduce((best, point, index) => (point.revenue > points[best].revenue ? index : best), 0);
  const peak = points[peakIndex];
  const labelIndexes = points.length <= 5 ? points.map((_, index) => index) : [0, 1, 2, 3, 4].map((step) => Math.round((step / 4) * (points.length - 1)));
  const hasRevenue = view.revenueTotal > 0;
  const summary = points.map((point) => `${point.label}: ${currency.format(point.revenue)} revenue, ${point.leads} leads`).join("; ");

  return (
    <Surface tone="primary" className="overflow-hidden">
      <SurfaceHeader className="items-start">
        <div className="min-w-0">
          <SurfaceTitle className="text-white">Revenue trajectory</SurfaceTitle>
          <p className="mt-1 text-sm text-white/75">Closed-won revenue across {view.period.toLowerCase()} with new-lead volume overlay.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white">
          <TrendingUp className="size-3.5" strokeWidth={2.25} />
          {view.revenueDelta === null ? "New period" : `${view.revenueDelta >= 0 ? "+" : ""}${view.revenueDelta}%`}
        </span>
      </SurfaceHeader>
      <div className="mt-8" aria-label={`Revenue trend for ${view.rangeLabel}. ${summary}`}>
        <div className="relative h-48">
          <div className="absolute inset-x-0 top-0 border-t border-white/15" />
          <div className="absolute inset-x-0 top-1/2 border-t border-white/15" />
          <div className="absolute inset-x-0 bottom-0 border-t border-white/15" />
          {points.length ? (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              <defs>
                <linearGradient id="revenue-wash" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={`0,100 ${revenueLine} 100,100`} fill="url(#revenue-wash)" />
              <polyline points={leadLine} fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
              <polyline points={revenueLine} fill="none" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              {hasRevenue ? <circle cx={x(peakIndex)} cy={100 - (peak.revenue / maxRevenue) * 100} r="2.5" fill="white" vectorEffect="non-scaling-stroke" /> : null}
            </svg>
          ) : null}
          <div className="absolute top-0 right-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary-deep shadow-float">{hasRevenue ? `${currency.format(view.revenueTotal)} revenue` : "No revenue yet"}</div>
          <div className="absolute inset-x-0 -bottom-5 flex justify-between text-[10px] font-medium text-white/65">
            {labelIndexes.map((index) => (
              <span key={index}>{points[index]?.label}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-white/20 pt-4 text-xs text-white/75">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-white" />
          Revenue
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-white/40" />
          New leads
        </span>
        <span className="ml-auto font-bold text-white">{hasRevenue && peak ? `Peak ${currency.format(peak.revenue)} on ${peak.label}` : "Log closed-won calls to see revenue here"}</span>
      </div>
    </Surface>
  );
}

function FunnelCard({ view }: { view: ReportsView }) {
  const total = view.funnel[0]?.count ?? 0;
  return (
    <Surface>
      <SurfaceHeader>
        <div className="min-w-0">
          <SurfaceTitle>Pipeline funnel</SurfaceTitle>
          <p className="mt-1 text-sm text-muted-foreground">Leads added in this period and how far they have progressed.</p>
        </div>
        <BarChart3 className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
      </SurfaceHeader>
      {total === 0 ? (
        <CardEmpty icon={BarChart3} title="No new leads in this period" description="Leads added during the selected period will show their journey here." />
      ) : (
        <>
          <div className="mt-6 space-y-4" aria-label={view.funnel.map((stage) => `${stage.label} ${stage.count} (${stage.rate}%)`).join(", ")}>
            {view.funnel.map((stage) => (
              <div key={stage.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold">{stage.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {stage.count} · {stage.rate}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.max(stage.rate, stage.count > 0 ? 3 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Lead to close</span>
            <span className="text-sm font-bold text-success">{view.conversion.leadToClose ?? 0}%</span>
          </div>
        </>
      )}
    </Surface>
  );
}

function OutcomesCard({ view }: { view: ReportsView }) {
  return (
    <Surface>
      <SurfaceHeader>
        <div className="min-w-0">
          <SurfaceTitle>Call outcomes</SurfaceTitle>
          <p className="mt-1 text-sm text-muted-foreground">{view.callsAnalyzed} calls analyzed</p>
        </div>
        <LineChart className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
      </SurfaceHeader>
      {view.outcomeMix.length === 0 ? (
        <CardEmpty icon={LineChart} title="No calls logged yet" description="Outcomes appear as soon as calls are logged in this period." />
      ) : (
        <div className="mt-6 space-y-4" aria-label={view.outcomeMix.map((outcome) => `${outcome.label} ${outcome.count} (${outcome.percentage}%)`).join(", ")}>
          {view.outcomeMix.map((outcome, index) => (
            <div key={outcome.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-semibold">{outcome.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {outcome.count} · {outcome.percentage}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted">
                <div className={cn("h-full rounded-full", categoricalTones[index] ?? "bg-chart-5")} style={{ width: `${outcome.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Surface>
  );
}

function CampaignTable({ view, mode }: { view: ReportsView; mode: "efficiency" | "conversion" }) {
  return (
    <Surface>
      <SurfaceHeader>
        <div className="min-w-0">
          <SurfaceTitle>{mode === "efficiency" ? "Campaign efficiency" : "Conversion by campaign"}</SurfaceTitle>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "efficiency" ? "Attribution, activity, and return by source." : "Which sources turn into customers."}</p>
        </div>
      </SurfaceHeader>
      {view.campaigns.length === 0 ? (
        <CardEmpty icon={BarChart3} title="No campaign activity" description="Campaigns with leads or calls in this period will be listed here." />
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead className="border-b border-border text-[11px] text-muted-foreground">
              <tr>
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium">Leads</th>
                <th className="pb-3 font-medium">Calls</th>
                <th className="pb-3 font-medium">Won</th>
                <th className="pb-3 font-medium">Revenue</th>
                <th className="pb-3 text-right font-medium">{mode === "efficiency" ? "ROAS" : "Conversion"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {view.campaigns.map((campaign) => {
                const conversion = campaign.leads > 0 ? Math.round((campaign.won / campaign.leads) * 100) : null;
                return (
                  <tr key={campaign.name} className="text-sm">
                    <td className="py-3">
                      <p className="font-bold">{campaign.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{campaign.project}</p>
                      <div className="mt-2 h-1.5 w-28 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-chart-1" style={{ width: `${campaign.share}%` }} />
                      </div>
                    </td>
                    <td className="py-3 font-semibold tabular-nums">{campaign.leads}</td>
                    <td className="py-3 text-muted-foreground tabular-nums">{campaign.calls}</td>
                    <td className="py-3 text-success tabular-nums">{campaign.won}</td>
                    <td className="py-3 font-semibold tabular-nums">{currency.format(campaign.revenue)}</td>
                    <td className="py-3 text-right">
                      {mode === "efficiency" ? (
                        <span className={cn(chipClass, campaign.roas === null ? toneChipClasses.muted : campaign.roas >= 1 ? toneChipClasses.success : toneChipClasses.warning)}>{campaign.roas === null ? "No spend" : `${campaign.roas}x`}</span>
                      ) : (
                        <span className={cn(chipClass, conversion === null ? toneChipClasses.muted : conversion >= 20 ? toneChipClasses.success : toneChipClasses.primary)}>{conversion === null ? "—" : `${conversion}%`}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Surface>
  );
}

function TargetsCard({ view, person, canManage, onSetTargets }: { view: ReportsView; person: ReportPerson | null; canManage: boolean; onSetTargets: (person: TargetPerson) => void }) {
  const hasTargets = view.targets.metrics.some((metric) => metric.target > 0);
  return (
    <Surface>
      <SurfaceHeader>
        <div className="min-w-0">
          <SurfaceTitle>Target progress</SurfaceTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {view.targets.monthLabel} · {view.scopeLabel}
          </p>
        </div>
        {canManage && person ? (
          <button type="button" onClick={() => onSetTargets({ code: person.code, name: person.name })} className={cn(softPillClass, "h-9 shrink-0 pr-4 pl-3 text-xs font-bold")}>
            <Target className="size-4" strokeWidth={1.75} />
            Set targets
          </button>
        ) : (
          <Target className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
        )}
      </SurfaceHeader>
      {!hasTargets ? (
        <CardEmpty icon={Target} title="No targets for this month" description={canManage ? (person ? "Set monthly targets to track attainment here." : "Pick a person, or set targets from the Team performance leaderboard.") : "Targets show here once a manager sets them."} />
      ) : (
        <div className="mt-5 space-y-4" aria-label={view.targets.metrics.map((metric) => `${metric.label} ${formatMetric(metric.kind, metric.actual)} of ${formatMetric(metric.kind, metric.target)}`).join(", ")}>
          {view.targets.metrics.map((metric) => {
            const tone = attainmentTone(metric.attainment);
            return (
              <div key={metric.key}>
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold">{metric.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatMetric(metric.kind, metric.actual)} / {metric.target > 0 ? formatMetric(metric.kind, metric.target) : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 min-w-0 flex-1 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.min(100, metric.attainment ?? 0)}%` }} />
                  </div>
                  <span className={cn(chipClass, "h-6 shrink-0 px-2", toneChipClasses[tone])}>{metric.attainment === null ? "No target" : `${metric.attainment}%`}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

function ConversionTiles({ view }: { view: ReportsView }) {
  const stats = view.conversion;
  const tiles = [
    { label: "Lead to close", value: stats.leadToClose === null ? "—" : `${stats.leadToClose}%`, detail: `${stats.wonLeads} of ${stats.cohortLeads} new leads closed` },
    { label: "Calls to close", value: stats.avgCallsToClose === null ? "—" : String(stats.avgCallsToClose), detail: "average calls per won lead" },
    { label: "Days to close", value: stats.avgDaysToClose === null ? "—" : String(stats.avgDaysToClose), detail: "average from lead added to won" },
    { label: "Average deal", value: stats.avgDeal === null ? "—" : currency.format(stats.avgDeal), detail: "per closed-won lead" },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <Surface key={tile.label} className="p-4">
          <p className="text-sm text-muted-foreground">{tile.label}</p>
          <p className="mt-4 text-[32px] leading-none font-bold tracking-tight">{tile.value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{tile.detail}</p>
        </Surface>
      ))}
    </section>
  );
}

function StageConversionCard({ view }: { view: ReportsView }) {
  return (
    <Surface>
      <SurfaceHeader>
        <div className="min-w-0">
          <SurfaceTitle>Stage-to-stage conversion</SurfaceTitle>
          <p className="mt-1 text-sm text-muted-foreground">Share of leads that make it from each stage to the next.</p>
        </div>
        <Target className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
      </SurfaceHeader>
      {view.stageConversion.length === 0 ? (
        <CardEmpty icon={Target} title="Nothing to convert yet" description="Add leads in this period to see where they progress or stall." />
      ) : (
        <ul className="mt-5 divide-y divide-border">
          {view.stageConversion.map((step, index) => {
            const from = view.funnel[index];
            const to = view.funnel[index + 1];
            return (
              <li key={`${step.from}-${step.to}`} className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {step.from} → {step.to}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {from.count} → {to.count} leads
                  </span>
                </span>
                <span className={cn(chipClass, step.rate === null ? toneChipClasses.muted : step.rate >= 50 ? toneChipClasses.success : step.rate >= 25 ? toneChipClasses.primary : toneChipClasses.warning)}>{step.rate === null ? "—" : `${step.rate}%`}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}

function LeaderboardCard({ view, canManage, onSetTargets }: { view: ReportsView; canManage: boolean; onSetTargets: (person: TargetPerson) => void }) {
  return (
    <Surface className="min-w-0">
      <SurfaceHeader>
        <div className="min-w-0">
          <SurfaceTitle>Team leaderboard</SurfaceTitle>
          <p className="mt-1 text-sm text-muted-foreground">Activity in this period and attainment against {view.targets.monthLabel} targets.</p>
        </div>
        <UsersRound className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
      </SurfaceHeader>
      {view.leaderboard.length === 0 ? (
        <CardEmpty icon={UsersRound} title="No active teammates" description="Invite teammates from the Team page to see them ranked here." />
      ) : (
        <>
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-180 text-left">
              <thead className="border-b border-border text-[11px] text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Person</th>
                  <th className="pb-3 font-medium">Calls</th>
                  <th className="pb-3 font-medium">Contact rate</th>
                  <th className="pb-3 font-medium">Won</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Month targets</th>
                  {canManage ? <th className="pb-3 text-right font-medium">Action</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {view.leaderboard.map((rep, index) => (
                  <tr key={rep.code} className="text-sm">
                    <td className="py-3">
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{rep.initials}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold">
                            {index + 1}. {rep.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">{rep.role}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3 font-semibold tabular-nums">{rep.calls}</td>
                    <td className="py-3">
                      <span className="font-semibold">{rep.contactRate === null ? "—" : `${rep.contactRate}%`}</span>
                      <div className="mt-1 h-1.5 w-20 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-chart-1" style={{ width: `${rep.contactRate ?? 0}%` }} />
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-success tabular-nums">{rep.won}</td>
                    <td className="py-3 font-semibold tabular-nums">{currency.format(rep.revenue)}</td>
                    <td className="py-3">
                      <span className={cn(chipClass, toneChipClasses[attainmentTone(rep.monthAttainment)])}>{rep.monthAttainment === null ? "No targets" : `${rep.monthAttainment}%`}</span>
                    </td>
                    {canManage ? (
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => onSetTargets({ code: rep.code, name: rep.name })} className={cn(softPillClass, "h-9 pr-4 pl-3 text-xs font-bold")}>
                          <Target className="size-4" strokeWidth={1.75} />
                          Targets
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-5 space-y-2 md:hidden">
            {view.leaderboard.map((rep, index) => (
              <li key={rep.code} className="rounded-2xl bg-muted/65 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{rep.initials}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {index + 1}. {rep.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{rep.role}</p>
                  </div>
                  <span className={cn(chipClass, "shrink-0", toneChipClasses[attainmentTone(rep.monthAttainment)])}>{rep.monthAttainment === null ? "No targets" : `${rep.monthAttainment}%`}</span>
                </div>
                <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Calls</dt>
                    <dd className="text-sm font-bold tabular-nums">{rep.calls}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Contact</dt>
                    <dd className="text-sm font-bold tabular-nums">{rep.contactRate === null ? "—" : `${rep.contactRate}%`}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Won</dt>
                    <dd className="text-sm font-bold text-success tabular-nums">{rep.won}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Revenue</dt>
                    <dd className="text-sm font-bold tabular-nums">{currency.format(rep.revenue)}</dd>
                  </div>
                </dl>
                {canManage ? (
                  <button type="button" onClick={() => onSetTargets({ code: rep.code, name: rep.name })} className={cn(softPillClass, "mt-3 h-11 w-full text-sm")}>
                    <Target className="size-4" strokeWidth={1.75} />
                    Set targets
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </Surface>
  );
}

function HeatmapCard({ view }: { view: ReportsView }) {
  const total = view.heatmap.counts.flat().reduce((sum, count) => sum + count, 0);
  return (
    <Surface>
      <SurfaceHeader>
        <div className="min-w-0">
          <SurfaceTitle>Activity heatmap</SurfaceTitle>
          <p className="mt-1 text-sm text-muted-foreground">Calls by weekday and time of day.</p>
        </div>
        <CalendarDays className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
      </SurfaceHeader>
      {total === 0 ? (
        <CardEmpty icon={CalendarDays} title="No calls in this period" description="Call timing patterns will appear once calls are logged." />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1.5" aria-label={`Activity heatmap of ${total} calls by weekday and two-hour block`}>
            {view.heatmap.days.map((day, dayIndex) => (
              <div key={day} className="contents">
                <span className="self-center text-[10px] font-medium text-muted-foreground">{day}</span>
                <div className="grid grid-cols-12 gap-1.5">
                  {view.heatmap.levels[dayIndex].map((level, blockIndex) => (
                    <span key={blockIndex} title={`${day} ${view.heatmap.blocks[blockIndex]}: ${view.heatmap.counts[dayIndex][blockIndex]} calls`} className={cn("aspect-square rounded-[5px]", heatmapTones[level])} />
                  ))}
                </div>
              </div>
            ))}
            <span />
            <div className="grid grid-cols-12 gap-1.5 text-center text-[10px] font-medium text-muted-foreground">
              {view.heatmap.blocks.map((block, index) => (
                <span key={block} className={cn(index % 3 !== 0 && "invisible")}>
                  {block}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Less activity</span>
            <div className="flex gap-1">
              {heatmapTones.map((tone) => (
                <span key={tone} className={cn("size-3 rounded-[5px]", tone)} />
              ))}
            </div>
            <span>More activity</span>
          </div>
        </>
      )}
    </Surface>
  );
}

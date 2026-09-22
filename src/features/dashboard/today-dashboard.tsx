"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ChevronRight, CircleAlert, Clock3, Phone, Plus, TrendingUp, UserRound } from "lucide-react";

import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { chipClass, primaryPillClass, softPillClass, toneChipClasses } from "@/components/shared/pill";
import { useRolePreview } from "@/components/shared/role-preview";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";

import type { TodayScope } from "./fixtures/today.fixture";

const toneClasses = toneChipClasses;

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export type TodayDashboardView = {
  todayKpis: { label: string; value: string; delta: string; detail: string }[];
  todayFollowUps: { initials: string; name: string; company: string; stage: string; due: string; tone: string; clientCode: string }[];
  attentionItems: { label: string; count: number; detail: string; tone: string }[];
  recentCalls: { initials: string; name: string; outcome: string; note: string; time: string; tone: string }[];
  pipelineMomentum: { label: string; value: number; width: string }[];
  weeklyCalls: number[];
  weeklyDayLabels: string[];
  callsThisWeekTotal: number;
  revenueWon: number;
  contactRate: number;
};

export function TodayDashboard({ view }: { view: TodayDashboardView | null }) {
  const { effectivePermissions } = useRolePreview();
  const safeView = view ?? {
    todayKpis: [],
    todayFollowUps: [],
    attentionItems: [],
    recentCalls: [],
    pipelineMomentum: [],
    weeklyCalls: [0, 0, 0, 0, 0, 0, 0],
    weeklyDayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    callsThisWeekTotal: 0,
    revenueWon: 0,
    contactRate: 0,
  };

  const canSeeTeamScope = hasPermission(effectivePermissions, "dashboard:view_team_scope");
  const [requestedScope, setScope] = useState<TodayScope>("My performance");
  const scope = canSeeTeamScope ? requestedScope : "My performance";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div>
          <p className="text-sm font-medium text-primary">{today}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Today&apos;s command center</h2>
          <p className="mt-1 text-sm text-muted-foreground">Focus on the conversations most likely to move forward.</p>
        </div>

        <div className="flex gap-2">
          <label className={cn(softPillClass, "h-11 px-4 text-sm")}>
            <UserRound className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Dashboard scope</span>
            <select
              aria-label="Dashboard scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as TodayScope)}
              className="appearance-none bg-transparent outline-none"
            >
              <option>My performance</option>
              {canSeeTeamScope ? (
                <>
                  <option>Team performance</option>
                  <option>All workspace</option>
                </>
              ) : null}
            </select>
          </label>

          <Link href="/leads" className={cn(primaryPillClass, "h-11 px-5 text-sm")}>
            <Plus className="size-4" strokeWidth={2.5} />
            Log a call
          </Link>
        </div>
      </section>

      <Surface tone="primary" className="overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white/75">Workspace pulse · {scope}</p>
            <h3 className="mt-2 text-[40px] leading-none font-bold tracking-tight">{currency.format(safeView.revenueWon)}</h3>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/85">
              <ArrowUpRight className="size-4" strokeWidth={2.25} />
              {safeView.contactRate}% contact rate this week
            </p>
          </div>

          <div className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white">
            {safeView.callsThisWeekTotal} calls this week
          </div>
        </div>

        <div className="mt-8" aria-label={`Weekly calls completed: ${safeView.weeklyDayLabels.map((label, index) => `${label} ${safeView.weeklyCalls[index]}`).join(", ")}`}>
          <div className="flex h-28 items-end gap-2 sm:gap-4">
            {safeView.weeklyCalls.map((value, index) => (
              <div key={`${safeView.weeklyDayLabels[index]}-${index}`} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="w-full rounded-full bg-white/15" style={{ height: `${Math.max(8, value)}%` }} />
                <span className="text-center text-[10px] font-medium text-white/70">{safeView.weeklyDayLabels[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Surface>
          <SurfaceHeader>
            <SurfaceTitle>Performance snapshot</SurfaceTitle>
            <button className={cn(softPillClass, "h-9 px-3 text-xs")}>This week</button>
          </SurfaceHeader>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {safeView.todayKpis.length > 0 ? (
              safeView.todayKpis.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <span className="text-2xl font-bold tracking-tight">{item.value}</span>
                    {item.delta ? <span className={cn(chipClass, toneClasses.primary)}>{item.delta}</span> : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground md:col-span-2">
                No data available yet.
              </div>
            )}
          </div>
        </Surface>

        <Surface>
          <SurfaceHeader>
            <SurfaceTitle>Attention</SurfaceTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </SurfaceHeader>

          <div className="mt-5 space-y-3">
            {safeView.attentionItems.length > 0 ? (
              safeView.attentionItems.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className={cn(chipClass, toneClasses[item.tone as keyof typeof toneClasses] ?? toneClasses.primary)}>{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No active attention items.</p>
            )}
          </div>
        </Surface>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Surface>
          <SurfaceHeader>
            <SurfaceTitle>Follow-ups</SurfaceTitle>
            <button className={cn(softPillClass, "h-9 px-3 text-xs")}>View calendar</button>
          </SurfaceHeader>

          <ul className="mt-5 space-y-3">
            {safeView.todayFollowUps.length > 0 ? (
              safeView.todayFollowUps.map((lead) => (
                <li key={`${lead.name}-${lead.clientCode}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {lead.initials}
                    </div>

                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.company}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{lead.stage}</p>
                    <span className={cn(chipClass, toneClasses[lead.tone as keyof typeof toneClasses] ?? toneClasses.primary)}>{lead.due}</span>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
            )}
          </ul>
        </Surface>

        <Surface>
          <SurfaceHeader>
            <SurfaceTitle>Recent calls</SurfaceTitle>
            <Phone className="size-4 text-muted-foreground" />
          </SurfaceHeader>

          <ul className="mt-5 space-y-3">
            {safeView.recentCalls.length > 0 ? (
              safeView.recentCalls.map((call) => (
                <li key={`${call.name}-${call.time}`} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {call.initials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium">{call.name}</p>
                      <span className={cn(chipClass, toneClasses[call.tone as keyof typeof toneClasses] ?? toneClasses.primary)}>{call.outcome}</span>
                      <p className="mt-1 text-xs text-muted-foreground">{call.note || "No summary added."}</p>
                    </div>
                  </div>

                  <time className="shrink-0 text-xs text-muted-foreground">{call.time}</time>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity recorded.</p>
            )}
          </ul>
        </Surface>
      </div>

      <Surface>
        <SurfaceHeader>
          <SurfaceTitle>Pipeline momentum</SurfaceTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-4" />
            Live view
          </div>
        </SurfaceHeader>

        <div className="mt-5 space-y-4">
          {safeView.pipelineMomentum.length > 0 ? (
            safeView.pipelineMomentum.map((stage) => (
              <div key={stage.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="text-muted-foreground">{stage.value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted">
                  <div className="h-2.5 rounded-full bg-primary" style={{ width: stage.width }} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No pipeline activity yet.</p>
          )}
        </div>

        <Link href="/reports" className={cn(softPillClass, "mt-6 h-11 w-full text-sm")}>
          Open reports
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </Link>
      </Surface>

      <div className="flex items-center justify-between rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CircleAlert className="size-4" />
          Keep an eye on deals that need a follow-up this week.
        </div>
        <span className="font-medium text-primary">{safeView.callsThisWeekTotal} calls</span>
      </div>
    </div>
  );
}

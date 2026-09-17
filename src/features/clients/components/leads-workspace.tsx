"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDownUp, Check, Filter, MessageCircle, Phone, RotateCcw, SearchX, SlidersHorizontal, UserRoundPlus, Users } from "lucide-react";
import { chipClass, primaryPillClass, softPillClass } from "@/components/shared/pill";
import { FilterMenu } from "@/components/shared/filter-menu";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { cn } from "@/lib/utils";
import { useRolePreview } from "@/components/shared/role-preview";
import { hasPermission } from "@/lib/permissions";
import type { AssignableRep, Lead } from "@/features/clients/fixtures/leads.fixture";
import { reassignClientsAction } from "@/actions/clients";
import { QuickLogCall } from "./quick-log-call";

const filterOptions = ["All leads", "Needs attention", "No calls yet", "Overdue follow-up"];
const sortOptions = ["Newest follow-up", "Oldest follow-up", "Most calls", "Name A-Z"];

const stageClasses = {
  "New Lead": "bg-accent text-accent-foreground",
  "Attempted Contact": "bg-muted text-muted-foreground",
  Qualified: "bg-success/12 text-success",
  "Demo Scheduled": "bg-primary/12 text-primary",
  "Proposal Sent": "bg-warning/12 text-warning",
  "Closed Won": "bg-success/12 text-success",
  "Closed Lost": "bg-destructive/12 text-destructive",
};

function attentionClass(attention: Lead["attention"]) {
  return attention === "overdue" ? "text-destructive" : attention === "today" ? "text-warning" : "text-muted-foreground";
}

export function LeadsWorkspace({ initialLeads, assignableReps }: { initialLeads: Lead[]; assignableReps: AssignableRep[] }) {
  const leads = initialLeads;
  const { effectivePermissions } = useRolePreview();
  const canReassign = hasPermission(effectivePermissions, "leads:reassign");
  const [activeFilter, setActiveFilter] = useState("All leads");
  const [campaignFilter, setCampaignFilter] = useState("All campaigns");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [sortBy, setSortBy] = useState("Newest follow-up");
  const [loggingLead, setLoggingLead] = useState<Lead | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reassignOpen, setReassignOpen] = useState(false);
  const campaigns = ["All campaigns", ...new Set(leads.map((lead) => lead.campaign))];
  const stages = ["All stages", ...new Set(leads.map((lead) => lead.stage))];
  const visibleLeads = leads
    .filter((lead) => activeFilter === "All leads" || (activeFilter === "No calls yet" && lead.callCount === 0) || (activeFilter === "Overdue follow-up" && lead.attention === "overdue") || (activeFilter === "Needs attention" && lead.attention !== "clear"))
    .filter((lead) => campaignFilter === "All campaigns" || lead.campaign === campaignFilter)
    .filter((lead) => stageFilter === "All stages" || lead.stage === stageFilter)
    .sort((first, second) => (sortBy === "Most calls" ? second.callCount - first.callCount : sortBy === "Name A-Z" ? first.name.localeCompare(second.name) : sortBy === "Oldest follow-up" ? second.id.localeCompare(first.id) : first.id.localeCompare(second.id)));

  const openLog = (lead: Lead) => {
    setLoggingLead(lead);
    setLogOpen(true);
  };

  const resetFilters = () => {
    setActiveFilter("All leads");
    setCampaignFilter("All campaigns");
    setStageFilter("All stages");
    setSortBy("Newest follow-up");
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => (current.size === visibleLeads.length ? new Set() : new Set(visibleLeads.map((lead) => lead.id))));
  };

  const selectedLeads = leads.filter((lead) => selectedIds.has(lead.id));

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div>
          <p className="text-sm font-medium text-primary">Sales workspace</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Lead pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">Prioritize the conversations that move revenue forward.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/import" className={cn(softPillClass, "h-11 px-5 text-sm")}>
            Import leads
          </Link>
          <button type="button" className={cn(primaryPillClass, "h-11 px-5 text-sm")}>
            <UserRoundPlus className="size-4" strokeWidth={1.75} />
            New lead
          </button>
        </div>
      </section>

      <Surface>
        <SurfaceHeader className="items-start">
          <div>
            <SurfaceTitle>Active leads</SurfaceTitle>
            <p className="mt-1 text-sm text-muted-foreground">{visibleLeads.length} leads in your current view</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <FilterMenu label="Lead view" value={activeFilter} options={filterOptions} onChange={setActiveFilter} icon={Filter} />
            <FilterMenu label="Campaign" value={campaignFilter} options={campaigns} onChange={setCampaignFilter} />
            <FilterMenu label="Stage" value={stageFilter} options={stages} onChange={setStageFilter} />
            <FilterMenu label="Sort" value={sortBy} options={sortOptions} onChange={setSortBy} icon={ArrowDownUp} />
          </div>
        </SurfaceHeader>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            <SlidersHorizontal className="mr-1 inline size-3.5" strokeWidth={1.75} />
            {activeFilter} · {campaignFilter} · {stageFilter}
          </p>
          <button type="button" onClick={resetFilters} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <RotateCcw className="size-3.5" strokeWidth={1.75} />
            Reset
          </button>
        </div>
      </Surface>

      {canReassign && selectedIds.size > 0 ? (
        <div className="sticky top-18 z-10 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-canvas-foreground shadow-float lg:top-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">{selectedIds.size}</span>
          <span className="font-semibold">{selectedIds.size} lead{selectedIds.size === 1 ? "" : "s"} selected</span>
          <button type="button" onClick={() => setSelectedIds(new Set())} className="text-canvas-muted transition-colors hover:text-canvas-foreground">
            Clear
          </button>
          <button type="button" onClick={() => setReassignOpen(true)} className={cn(primaryPillClass, "ml-auto h-9 gap-1.5 px-4 text-xs")}>
            <Users className="size-3.5" strokeWidth={1.75} />
            Reassign
          </button>
        </div>
      ) : null}

      {visibleLeads.length ? (
        <>
          <Surface className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-220 text-left">
                <thead className="border-b border-border bg-muted/60">
                  <tr className="text-[11px] font-medium text-muted-foreground">
                    {canReassign ? (
                      <th className="w-11 px-5 py-3">
                        <input type="checkbox" aria-label="Select all visible leads" checked={selectedIds.size > 0 && selectedIds.size === visibleLeads.length} onChange={toggleSelectAll} className="size-4 rounded border-input accent-primary" />
                      </th>
                    ) : null}
                    <th className="px-5 py-3">Lead</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Follow-up</th>
                    <th className="px-4 py-3 text-center">Calls</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleLeads.map((lead) => (
                    <LeadTableRow key={lead.id} lead={lead} onLog={openLog} canReassign={canReassign} selected={selectedIds.has(lead.id)} onToggleSelected={() => toggleSelected(lead.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
          <div className="space-y-3 md:hidden">
            {visibleLeads.map((lead) => (
              <LeadMobileRow key={lead.id} lead={lead} onLog={openLog} canReassign={canReassign} selected={selectedIds.has(lead.id)} onToggleSelected={() => toggleSelected(lead.id)} />
            ))}
          </div>
        </>
      ) : (
        <Surface>
          <div className="grid min-h-52 place-items-center text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary">
                <SearchX className="size-5" strokeWidth={1.75} />
              </span>
              <p className="mt-3 text-sm font-bold">No leads match these filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Adjust the dropdowns to see more of your pipeline.</p>
              <button type="button" onClick={resetFilters} className={cn(primaryPillClass, "mt-4 h-11 px-5 text-sm")}>
                Reset filters
              </button>
            </div>
          </div>
        </Surface>
      )}

      <QuickLogCall lead={loggingLead} open={logOpen} onOpenChange={setLogOpen} />
      <ReassignDialog leads={selectedLeads} assignableReps={assignableReps} open={reassignOpen} onOpenChange={setReassignOpen} onDone={() => setSelectedIds(new Set())} />
    </div>
  );
}

function LeadTableRow({ lead, onLog, canReassign, selected, onToggleSelected }: { lead: Lead; onLog: (lead: Lead) => void; canReassign: boolean; selected: boolean; onToggleSelected: () => void }) {
  return (
    <tr className={cn("transition-colors hover:bg-muted/55", selected && "bg-accent/40")}>
      {canReassign ? (
        <td className="px-5 py-3.5">
          <input type="checkbox" aria-label={`Select ${lead.name}`} checked={selected} onChange={onToggleSelected} className="size-4 rounded border-input accent-primary" />
        </td>
      ) : null}
      <td className="px-5 py-3.5">
        <Link href={`/leads/${lead.id}`} className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{lead.initials}</span>
          <span>
            <span className="block text-sm font-bold">{lead.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {lead.business} · {lead.phone}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold">{lead.campaign}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{lead.project}</p>
      </td>
      <td className="px-4 py-3.5 text-sm font-semibold">{lead.assignee}</td>
      <td className="px-4 py-3.5">
        <span className={cn(chipClass, stageClasses[lead.stage])}>{lead.stage}</span>
      </td>
      <td className={cn("px-4 py-3.5 text-sm font-bold", attentionClass(lead.attention))}>{lead.nextFollowUp}</td>
      <td className="px-4 py-3.5 text-center text-sm font-bold tabular-nums">{lead.callCount}</td>
      <td className="px-5 py-3.5">
        <div className="flex justify-end gap-2">
          <a href={`tel:${lead.phone.replaceAll(/\D/g, "")}`} aria-label={`Call ${lead.name}`} onClick={() => onLog(lead)} className={cn(primaryPillClass, "grid size-11 place-items-center rounded-full p-0")}>
            <Phone className="size-5" strokeWidth={1.75} />
          </a>
          <a href={`https://wa.me/${lead.phone.replaceAll(/\D/g, "")}`} aria-label={`Message ${lead.name} on WhatsApp`} className={cn(softPillClass, "grid size-11 place-items-center rounded-full p-0")}>
            <MessageCircle className="size-5" strokeWidth={1.75} />
          </a>
          <button type="button" aria-label={`Log a call for ${lead.name}`} onClick={() => onLog(lead)} className={cn(softPillClass, "h-11 px-4 text-xs")}>
            Log call
          </button>
        </div>
      </td>
    </tr>
  );
}

function LeadMobileRow({ lead, onLog, canReassign, selected, onToggleSelected }: { lead: Lead; onLog: (lead: Lead) => void; canReassign: boolean; selected: boolean; onToggleSelected: () => void }) {
  return (
    <Surface className={cn("p-4", selected && "ring-2 ring-primary/40")}>
      <div className="flex gap-3">
        {canReassign ? <input type="checkbox" aria-label={`Select ${lead.name}`} checked={selected} onChange={onToggleSelected} className="mt-2 size-4 shrink-0 rounded border-input accent-primary" /> : null}
        <Link href={`/leads/${lead.id}`} className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">
          {lead.initials}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/leads/${lead.id}`} className="min-w-0">
              <p className="truncate text-sm font-bold">{lead.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.business}</p>
            </Link>
            <span className={cn(chipClass, "shrink-0", stageClasses[lead.stage])}>{lead.stage}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <span className="text-muted-foreground">
              {lead.campaign} · {lead.assignee}
            </span>
            <span className={cn("text-right font-bold", attentionClass(lead.attention))}>{lead.nextFollowUp}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <a href={`tel:${lead.phone.replaceAll(/\D/g, "")}`} aria-label={`Call ${lead.name}`} onClick={() => onLog(lead)} className={cn(primaryPillClass, "flex h-11 items-center justify-center rounded-full p-0")}>
          <Phone className="size-5" strokeWidth={1.75} />
        </a>
        <a href={`https://wa.me/${lead.phone.replaceAll(/\D/g, "")}`} aria-label={`Message ${lead.name} on WhatsApp`} className={cn(softPillClass, "flex h-11 items-center justify-center rounded-full p-0")}>
          <MessageCircle className="size-5" strokeWidth={1.75} />
        </a>
        <button type="button" onClick={() => onLog(lead)} className={cn(softPillClass, "h-11 text-xs")}>
          Log call
        </button>
      </div>
    </Surface>
  );
}

function ReassignDialog({ leads: targetLeads, assignableReps, open, onOpenChange, onDone }: { leads: Lead[]; assignableReps: AssignableRep[]; open: boolean; onOpenChange: (open: boolean) => void; onDone: () => void }) {
  const [chosen, setChosen] = useState<AssignableRep | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const maxLoad = Math.max(...assignableReps.map((rep) => rep.activeLeads), 1);

  const close = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setChosen(null);
      setDone(false);
      setError(null);
    }
  };

  const confirm = () => {
    if (!chosen) return;
    setError(null);
    startTransition(async () => {
      const result = await reassignClientsAction({ clientCodes: targetLeads.map((lead) => lead.id), toUserCode: chosen.code });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  };

  const finish = () => {
    close(false);
    onDone();
  };

  if (targetLeads.length === 0) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={close} title={`Reassign ${targetLeads.length} lead${targetLeads.length === 1 ? "" : "s"}`} description="Choose a teammate. Current workload is shown so you can balance the pipeline.">
      {done && chosen ? (
        <div className="grid min-h-72 place-items-center px-5 pb-5 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/12 text-success">
              <Check className="size-6" strokeWidth={2.25} />
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight">Leads reassigned</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {targetLeads.length} lead{targetLeads.length === 1 ? "" : "s"} moved to <span className="font-bold text-foreground">{chosen.name}</span>.
            </p>
            <button type="button" onClick={finish} className={cn(primaryPillClass, "mt-6 h-11 px-5 text-sm")}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-5 pb-5">
          <div className="rounded-2xl bg-muted p-3">
            <p className="text-xs font-bold text-muted-foreground">Leads in this batch</p>
            <p className="mt-1 text-sm font-semibold">{targetLeads.map((lead) => lead.name).join(", ")}</p>
          </div>
          <p className="text-sm font-bold">Assign to</p>
          <ul className="space-y-2">
            {assignableReps.map((rep) => {
              const selected = chosen?.code === rep.code;

              return (
                <li key={rep.code}>
                  <button type="button" onClick={() => setChosen(rep)} className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors", selected ? "border-primary bg-accent/60" : "border-border hover:bg-muted/60")}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{rep.initials}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold">{rep.name}</span>
                        <span className={cn(chipClass, "bg-muted text-muted-foreground")}>{rep.role}</span>
                      </span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${(rep.activeLeads / maxLoad) * 100}%` }} />
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{rep.activeLeads} active</span>
                      </span>
                    </span>
                    {selected ? <Check className="size-4 shrink-0 text-primary" strokeWidth={2.25} /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
          <button type="button" disabled={!chosen || pending} onClick={confirm} className={cn(primaryPillClass, "h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-50")}>
            {pending ? "Reassigning…" : chosen ? `Assign to ${chosen.name}` : "Choose a teammate"}
          </button>
        </div>
      )}
    </ResponsiveDialog>
  );
}

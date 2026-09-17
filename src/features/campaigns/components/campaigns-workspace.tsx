"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, DollarSign, Megaphone, MessageCircle, Pause, Play, Search, Share2, Sprout, Target, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { FilterMenu } from "@/components/shared/filter-menu";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { chipClass, primaryPillClass, softPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { campaignPlatforms, campaignStatuses, type Campaign } from "@/features/campaigns/fixtures/campaigns.fixture";
import { createCampaignAction, setCampaignStatusAction } from "@/actions/campaigns";
import { CampaignStatus } from "@/entities/enums";
import type { CampaignPlatform } from "@/entities/enums";

type ProjectOption = { code: string; name: string };

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const statusClasses = { Active: "bg-success/12 text-success", Paused: "bg-warning/12 text-warning", Ended: "bg-muted text-muted-foreground" };
const platformIcons: Record<Campaign["platform"], LucideIcon> = { Facebook: Megaphone, Instagram: MessageCircle, Referral: Share2, Organic: Sprout };

function roasFor(campaign: Campaign) {
  if (campaign.spend === 0) return "—";
  return `${(campaign.revenue / campaign.spend).toFixed(1)}x`;
}

export function CampaignsWorkspace({ initialCampaigns, projects }: { initialCampaigns: Campaign[]; projects: ProjectOption[] }) {
  const [platform, setPlatform] = useState<"All platforms" | Campaign["platform"]>("All platforms");
  const [project, setProject] = useState("All projects");
  const [status, setStatus] = useState<"All statuses" | Campaign["status"]>("All statuses");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [managedCampaign, setManagedCampaign] = useState<Campaign | null>(null);
  const campaignProjects = [...new Set(initialCampaigns.map((campaign) => campaign.project))];

  const visibleCampaigns = initialCampaigns
    .filter((campaign) => platform === "All platforms" || campaign.platform === platform)
    .filter((campaign) => project === "All projects" || campaign.project === project)
    .filter((campaign) => status === "All statuses" || campaign.status === status)
    .filter((campaign) => campaign.name.toLowerCase().includes(query.toLowerCase()));

  const totalSpend = initialCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const totalRevenue = initialCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const activeCount = initialCampaigns.filter((campaign) => campaign.status === "Active").length;

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div>
          <p className="text-sm font-medium text-primary">Lead acquisition</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Campaigns</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track every source&apos;s leads, spend, and return.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className={cn(primaryPillClass, "h-11 px-5 text-sm")}>
          <Megaphone className="size-4" strokeWidth={1.75} />
          New campaign
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <CampaignStat icon={Megaphone} label="Active campaigns" value={String(activeCount)} detail={`${initialCampaigns.length} total`} />
        <CampaignStat icon={Wallet} label="Total ad spend" value={currency.format(totalSpend)} detail="across all sources" />
        <CampaignStat icon={TrendingUp} label="Total attributed revenue" value={currency.format(totalRevenue)} detail={`${(totalRevenue / Math.max(totalSpend, 1)).toFixed(1)}x blended ROAS`} />
      </section>

      <Surface>
        <SurfaceHeader className="items-start">
          <div>
            <SurfaceTitle>All campaigns</SurfaceTitle>
            <p className="mt-1 text-sm text-muted-foreground">{visibleCampaigns.length} campaigns match your current view.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <FilterMenu label="Platform" value={platform} options={["All platforms", ...campaignPlatforms]} onChange={(value) => setPlatform(value as typeof platform)} />
            <FilterMenu label="Project" value={project} options={["All projects", ...campaignProjects]} onChange={setProject} />
            <FilterMenu label="Status" value={status} options={["All statuses", ...campaignStatuses]} onChange={(value) => setStatus(value as typeof status)} />
          </div>
        </SurfaceHeader>
        <label className="relative mt-5 block">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <input aria-label="Search campaigns" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by campaign name" className="h-11 w-full rounded-full border border-input bg-background pr-4 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
        </label>
      </Surface>

      {visibleCampaigns.length ? (
        <>
          <Surface className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-240 text-left">
                <thead className="border-b border-border bg-muted/60">
                  <tr className="text-[11px] font-medium text-muted-foreground">
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Leads</th>
                    <th className="px-4 py-3 text-center">Calls</th>
                    <th className="px-4 py-3 text-center">Won</th>
                    <th className="px-4 py-3">Spend</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-5 py-3 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleCampaigns.map((campaign) => (
                    <CampaignRow key={campaign.id} campaign={campaign} onManage={setManagedCampaign} />
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
          <div className="space-y-3 md:hidden">
            {visibleCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} onManage={setManagedCampaign} />
            ))}
          </div>
        </>
      ) : (
        <Surface>
          <div className="grid min-h-52 place-items-center text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary">
                <Search className="size-5" strokeWidth={1.75} />
              </span>
              <p className="mt-3 text-sm font-bold">No campaigns match these filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different platform, project, or status.</p>
            </div>
          </div>
        </Surface>
      )}

      <CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} projects={projects} />
      <ManageCampaignDialog campaign={managedCampaign} onClose={() => setManagedCampaign(null)} />
    </div>
  );
}

function CampaignStat({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <Surface className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="grid size-9 place-items-center rounded-full bg-accent text-primary">
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-5 text-[32px] leading-none font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </Surface>
  );
}

function CampaignIdentity({ campaign }: { campaign: Campaign }) {
  const Icon = platformIcons[campaign.platform];

  return (
    <div className="flex min-w-52 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{campaign.name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {campaign.platform} · {campaign.project}
        </span>
      </span>
    </div>
  );
}

function CampaignRow({ campaign, onManage }: { campaign: Campaign; onManage: (campaign: Campaign) => void }) {
  return (
    <tr className="cursor-pointer text-sm transition-colors hover:bg-muted/55" onClick={() => onManage(campaign)}>
      <td className="px-5 py-3.5">
        <CampaignIdentity campaign={campaign} />
      </td>
      <td className="px-4 py-3.5">
        <span className={cn(chipClass, statusClasses[campaign.status])}>{campaign.status}</span>
      </td>
      <td className="px-4 py-3.5 text-center font-semibold tabular-nums">{campaign.leads}</td>
      <td className="px-4 py-3.5 text-center text-muted-foreground tabular-nums">{campaign.calls}</td>
      <td className="px-4 py-3.5 text-center font-semibold text-success tabular-nums">{campaign.won}</td>
      <td className="px-4 py-3.5 font-semibold tabular-nums">{currency.format(campaign.spend)}</td>
      <td className="px-4 py-3.5 font-semibold tabular-nums">{currency.format(campaign.revenue)}</td>
      <td className="px-5 py-3.5 text-right">
        <span className={cn(chipClass, campaign.spend > 0 ? "bg-success/12 text-success" : "bg-muted text-muted-foreground")}>{roasFor(campaign)}</span>
      </td>
    </tr>
  );
}

function CampaignCard({ campaign, onManage }: { campaign: Campaign; onManage: (campaign: Campaign) => void }) {
  return (
    <Surface className="p-4">
      <div className="flex items-start justify-between gap-3">
        <CampaignIdentity campaign={campaign} />
        <span className={cn(chipClass, statusClasses[campaign.status])}>{campaign.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
        <div>
          <p className="text-sm font-bold tabular-nums">{campaign.leads}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Leads</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums">{campaign.won}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Won</p>
        </div>
        <div>
          <p className={cn("text-sm font-bold", campaign.spend > 0 ? "text-success" : "text-muted-foreground")}>{roasFor(campaign)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">ROAS</p>
        </div>
      </div>
      <button type="button" onClick={() => onManage(campaign)} className={cn(softPillClass, "mt-4 h-11 w-full text-sm")}>
        View details
      </button>
    </Surface>
  );
}

function CreateCampaignDialog({ open, onOpenChange, projects }: { open: boolean; onOpenChange: (open: boolean) => void; projects: ProjectOption[] }) {
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState(projects[0]?.code ?? "");
  const [platform, setPlatform] = useState<CampaignPlatform>(campaignPlatforms[0] as CampaignPlatform);
  const [adSpend, setAdSpend] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const close = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setName("");
      setProjectCode(projects[0]?.code ?? "");
      setPlatform(campaignPlatforms[0] as CampaignPlatform);
      setAdSpend("");
      setError(null);
    }
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCampaignAction({ name, projectCode, platform, adSpend: Number(adSpend) || 0 });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      close(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={close} title="New campaign" description="Attribute a new lead source to a project.">
      <div className="space-y-4 px-5 pb-5">
        <label className="block text-sm font-bold">
          Campaign name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="e.g. October Messages" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Project
            <select value={projectCode} onChange={(event) => setProjectCode(event.target.value)} className="mt-2 h-11 w-full appearance-none rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {projects.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Platform
            <select value={platform} onChange={(event) => setPlatform(event.target.value as CampaignPlatform)} className="mt-2 h-11 w-full appearance-none rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {campaignPlatforms.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-bold">
          Planned ad spend
          <input type="number" value={adSpend} onChange={(event) => setAdSpend(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="1000" />
        </label>
        {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
        <button type="button" disabled={pending || !name.trim() || !projectCode} onClick={submit} className={cn(primaryPillClass, "h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-50")}>
          <Check className="size-4" strokeWidth={2.25} />
          {pending ? "Creating…" : "Create campaign"}
        </button>
      </div>
    </ResponsiveDialog>
  );
}

function ManageCampaignDialog({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!campaign) return null;

  const setStatus = (status: CampaignStatus) => {
    startTransition(async () => {
      await setCampaignStatusAction(campaign.id, status);
      router.refresh();
      onClose();
    });
  };

  return (
    <ResponsiveDialog
      open={Boolean(campaign)}
      onOpenChange={(open) => !open && onClose()}
      title={campaign.name}
      description={`${campaign.platform} · ${campaign.project} · started ${campaign.startDate}`}
    >
      <div className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ManageStat label="Leads" value={String(campaign.leads)} />
          <ManageStat label="Calls" value={String(campaign.calls)} />
          <ManageStat label="Won" value={String(campaign.won)} tone="success" />
          <ManageStat label="ROAS" value={roasFor(campaign)} tone={campaign.spend > 0 ? "success" : undefined} />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted p-4 text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <DollarSign className="size-4" strokeWidth={1.75} />
            Spend vs revenue
          </span>
          <span className="font-bold tabular-nums">
            {currency.format(campaign.spend)} → {currency.format(campaign.revenue)}
          </span>
        </div>
        <div className="mt-5 space-y-3">
          <button type="button" className={cn(softPillClass, "h-11 w-full justify-start px-4 text-sm")}>
            <Target className="size-4" strokeWidth={1.75} />
            Edit budget and targets
          </button>
          {campaign.status === "Active" ? (
            <button type="button" disabled={pending} onClick={() => setStatus(CampaignStatus.PAUSED)} className={cn(softPillClass, "h-11 w-full justify-start px-4 text-sm text-warning disabled:pointer-events-none disabled:opacity-50")}>
              <Pause className="size-4" strokeWidth={1.75} />
              {pending ? "Pausing…" : "Pause campaign"}
            </button>
          ) : campaign.status === "Paused" ? (
            <button type="button" disabled={pending} onClick={() => setStatus(CampaignStatus.ACTIVE)} className={cn(softPillClass, "h-11 w-full justify-start px-4 text-sm text-success disabled:pointer-events-none disabled:opacity-50")}>
              <Play className="size-4" strokeWidth={1.75} />
              {pending ? "Resuming…" : "Resume campaign"}
            </button>
          ) : null}
          <button type="button" onClick={onClose} className={cn(primaryPillClass, "h-11 w-full text-sm")}>
            <Check className="size-4" strokeWidth={2.25} />
            Save changes
          </button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function ManageStat({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-2xl bg-muted p-3 text-center">
      <p className={cn("text-lg font-bold tabular-nums", tone === "success" && "text-success")}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

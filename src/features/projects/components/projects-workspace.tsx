"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, BriefcaseBusiness, Check, Megaphone, Search, Target, UsersRound } from "lucide-react";
import { FilterMenu } from "@/components/shared/filter-menu";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { chipClass, primaryPillClass, softPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { useSearchParamsUpdater } from "@/lib/use-search-params-updater";
import { useDebouncedSearchFilter } from "@/lib/use-debounced-search-filter";
import type { Paginated } from "@/lib/pagination";
import { projectStatuses, type Project } from "@/features/projects/fixtures/projects.fixture";
import { createProjectAction, archiveProjectAction } from "@/actions/projects";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const statusClasses: Record<string, string> = { Active: "bg-success/12 text-success", Planning: "bg-primary/12 text-primary", Archived: "bg-muted text-muted-foreground" };
const healthClasses: Record<string, string> = { "On track": "bg-success/12 text-success", "At risk": "bg-warning/12 text-warning", Behind: "bg-destructive/12 text-destructive" };

type Filters = { search: string; status: string };
type Summary = { total: number; activeCount: number; totalLeads: number; totalRevenue: number };

export function ProjectsWorkspace({ result, owners, summary, filters }: { result: Paginated<Project>; owners: string[]; summary: Summary; filters: Filters }) {
  const projects = result.items;
  const updateParams = useSearchParamsUpdater();
  const [searchInput, setSearchInput] = useDebouncedSearchFilter(filters.search);
  const [createOpen, setCreateOpen] = useState(false);
  const [managedProject, setManagedProject] = useState<Project | null>(null);

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div>
          <p className="text-sm font-medium text-primary">Sales operations</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">Group campaigns and targets under a sales initiative.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className={cn(primaryPillClass, "h-11 px-5 text-sm")}>
          <BriefcaseBusiness className="size-4" strokeWidth={1.75} />
          New project
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <ProjectStat icon={BriefcaseBusiness} label="Active projects" value={String(summary.activeCount)} detail={`${summary.total} total`} />
        <ProjectStat icon={UsersRound} label="Attributed leads" value={summary.totalLeads.toLocaleString()} detail="across all projects" />
        <ProjectStat icon={Target} label="Revenue to date" value={currency.format(summary.totalRevenue)} detail="all active initiatives" />
      </section>

      <Surface>
        <SurfaceHeader className="items-start">
          <div>
            <SurfaceTitle>All projects</SurfaceTitle>
            <p className="mt-1 text-sm text-muted-foreground">{result.total} projects match your current view.</p>
          </div>
        </SurfaceHeader>
        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <input aria-label="Search projects" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by project name" className="h-11 w-full rounded-full border border-input bg-background pr-4 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
          </label>
          <FilterMenu label="Status" value={filters.status} options={["All statuses", ...projectStatuses]} onChange={(value) => updateParams({ status: value === "All statuses" ? null : value })} />
        </div>
      </Surface>

      {projects.length ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onManage={setManagedProject} />
            ))}
          </section>
          <Surface className="py-3">
            <PaginationControls page={result.page} totalPages={result.totalPages} total={result.total} pageSize={result.pageSize} />
          </Surface>
        </>
      ) : (
        <Surface>
          <div className="grid min-h-52 place-items-center text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary">
                <Search className="size-5" strokeWidth={1.75} />
              </span>
              <p className="mt-3 text-sm font-bold">No projects match these filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different name or status.</p>
            </div>
          </div>
        </Surface>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} owners={owners} />
      <ManageProjectDialog project={managedProject} onClose={() => setManagedProject(null)} />
    </div>
  );
}

function ProjectStat({ icon: Icon, label, value, detail }: { icon: typeof BriefcaseBusiness; label: string; value: string; detail: string }) {
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

function ProjectCard({ project, onManage }: { project: Project; onManage: (project: Project) => void }) {
  const progress = Math.min(100, Math.round((project.actual / project.target) * 100));

  return (
    <Surface className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{project.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {project.id} · {project.owner}
          </p>
        </div>
        <span className={cn(chipClass, statusClasses[project.status])}>{project.status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
        <div>
          <p className="text-sm font-bold tabular-nums">{project.campaigns}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Campaigns</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums">{project.leads}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Leads</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums">{project.members}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Members</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className={cn(chipClass, healthClasses[project.health])}>{project.health}</span>
          <span className="font-bold tabular-nums">
            {currency.format(project.actual)} <span className="font-normal text-muted-foreground">/ {currency.format(project.target)}</span>
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button type="button" onClick={() => onManage(project)} className={cn(softPillClass, "mt-5 h-11 w-full text-sm")}>
        Manage project
      </button>
    </Surface>
  );
}

function CreateProjectDialog({ open, onOpenChange, owners }: { open: boolean; onOpenChange: (open: boolean) => void; owners: string[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState(owners[0] ?? "");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const close = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setName("");
      setDescription("");
      setOwner(owners[0] ?? "");
      setTarget("");
      setError(null);
    }
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createProjectAction({ name, description, ownerName: owner, revenueTarget: Number(target) || 0 });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      close(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={close} title="New project" description="Group upcoming campaigns and set a revenue target.">
      <div className="space-y-4 px-5 pb-5">
        <label className="block text-sm font-bold">
          Project name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="e.g. Spring Clinic Push" />
        </label>
        <label className="block text-sm font-bold">
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-20 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="What is this initiative for?" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Owner
            <select value={owner} onChange={(event) => setOwner(event.target.value)} className="mt-2 h-11 w-full appearance-none rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {owners.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Revenue target
            <input type="number" value={target} onChange={(event) => setTarget(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="20000" />
          </label>
        </div>
        {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
        <button type="button" disabled={pending || !name.trim() || !owner} onClick={submit} className={cn(primaryPillClass, "h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-50")}>
          <Check className="size-4" strokeWidth={2.25} />
          {pending ? "Creating…" : "Create project"}
        </button>
      </div>
    </ResponsiveDialog>
  );
}

function ManageProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!project) return null;

  const archive = () => {
    startTransition(async () => {
      await archiveProjectAction(project.id);
      router.refresh();
      onClose();
    });
  };

  return (
    <ResponsiveDialog open={Boolean(project)} onOpenChange={(open) => !open && onClose()} title={`Manage ${project.name}`} description="Update targets, ownership, or archive this project.">
      <div className="space-y-3 px-5 pb-5">
        <button type="button" className={cn(softPillClass, "h-11 w-full justify-start px-4 text-sm")}>
          <Target className="size-4" strokeWidth={1.75} />
          Edit target and dates
        </button>
        <button type="button" className={cn(softPillClass, "h-11 w-full justify-start px-4 text-sm")}>
          <Megaphone className="size-4" strokeWidth={1.75} />
          Manage campaigns ({project.campaigns})
        </button>
        {project.status !== "Archived" ? (
          <button type="button" disabled={pending} onClick={archive} className={cn(softPillClass, "h-11 w-full justify-start px-4 text-sm text-destructive disabled:pointer-events-none disabled:opacity-50")}>
            <Archive className="size-4" strokeWidth={1.75} />
            {pending ? "Archiving…" : "Archive project"}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className={cn(primaryPillClass, "h-11 w-full text-sm")}>
          <Check className="size-4" strokeWidth={2.25} />
          Done
        </button>
      </div>
    </ResponsiveDialog>
  );
}

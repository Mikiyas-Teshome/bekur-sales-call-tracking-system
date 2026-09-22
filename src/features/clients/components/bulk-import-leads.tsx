"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Check, ChevronDown, ClipboardPaste, FileUp, Phone, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { chipClass, primaryPillClass, softPillClass } from "@/components/shared/pill";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { cn } from "@/lib/utils";
import { bulkImportAction } from "@/actions/clients";
import { useRolePreview } from "@/components/shared/role-preview";
import { hasPermission } from "@/lib/permissions";

function extractNumbers(value: string) {
  return [...new Set(value.match(/(?:\+?251|0)?[\s-]*9[\d\s-]{7,10}/g)?.map((number) => number.replaceAll(/\D/g, "").replace(/^0/, "251")) ?? [])];
}

type ImportableCampaign = { code: string; name: string; project: string };

type Teammate = { code: string; name: string; role: string };

export function BulkImportLeads({ campaigns, existingPhones, teammates }: { campaigns: ImportableCampaign[]; existingPhones: string[]; teammates: Teammate[] }) {
  const { effectivePermissions } = useRolePreview();
  const canAssign = hasPermission(effectivePermissions, "leads:reassign") && teammates.length > 0;
  const [assigneeCode, setAssigneeCode] = useState("");
  const assignee = teammates.find((item) => item.code === assigneeCode) ?? null;
  const [source, setSource] = useState("");
  const [campaignCode, setCampaignCode] = useState(campaigns[0]?.code ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const numbers = extractNumbers(source);
  const existingNumbers = new Set(existingPhones);
  const newCount = numbers.filter((number) => !existingNumbers.has(number)).length;
  const campaign = campaigns.find((item) => item.code === campaignCode) ?? campaigns[0];

  const submit = () => {
    if (!campaign) return;
    setError(null);
    startTransition(async () => {
      const response = await bulkImportAction({ text: source, campaignCode: campaign.code, assigneeCode: canAssign && assigneeCode ? assigneeCode : undefined });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setResult({ created: response.created, skipped: response.skipped });
      setSubmitted(true);
      router.refresh();
    });
  };

  if (submitted && result) return <section className="grid min-h-[60dvh] place-items-center"><div className="max-w-sm text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-success/12 text-success"><Check className="size-7" strokeWidth={2.25} /></span><h2 className="mt-5 text-xl font-bold tracking-tight">Import complete</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{result.created} new leads were added to the {campaign?.name} campaign. {result.skipped} numbers already existed and were skipped.</p><Link href="/leads" className={cn(primaryPillClass, "mt-6 h-11 px-5 text-sm")}>Return to leads</Link></div></section>;

  return <div className="mx-auto max-w-5xl space-y-4 lg:space-y-5"><Link href="/leads" className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ArrowLeft className="size-4" strokeWidth={1.75} />Back to leads</Link><div><p className="text-sm font-medium text-primary">Lead acquisition</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Import leads</h2><p className="mt-1 text-sm text-muted-foreground">Paste numbers from any source and assign their campaign once.</p></div><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-5"><Surface><SurfaceHeader><div><SurfaceTitle>Paste phone numbers</SurfaceTitle><p className="mt-1 text-sm text-muted-foreground">One per line, or paste text directly from WhatsApp.</p></div><span className="grid size-11 place-items-center rounded-full bg-accent text-primary"><ClipboardPaste className="size-5" strokeWidth={1.75} /></span></SurfaceHeader><Textarea value={source} onChange={(event) => setSource(event.target.value)} className="mt-5 min-h-52 rounded-2xl" placeholder={"+251 91 248 7310\n+251 92 344 1908\n091 555 8201"} /><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Numbers are normalized before duplicate checks.</p><button type="button" onClick={() => setSource("+251 91 248 7310\n+251 92 344 1908\n+251 91 662 2304\n+251 93 811 4002")} className={cn(softPillClass, "h-9 shrink-0 px-4 text-xs")}>Use sample</button></div></Surface><Surface><SurfaceTitle>Import details</SurfaceTitle><div className="mt-5 space-y-4"><div><p className="text-xs text-muted-foreground">Campaign</p><div className="relative mt-2"><select aria-label="Campaign" value={campaignCode} onChange={(event) => setCampaignCode(event.target.value)} className="h-11 w-full appearance-none rounded-full border border-input bg-background px-4 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{campaigns.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" /></div></div><div><p className="text-xs text-muted-foreground">Project</p><p className="mt-2 text-sm font-bold">{campaign?.project ?? "—"}</p></div>{canAssign ? <div><p className="text-xs text-muted-foreground">Assign to</p><div className="relative mt-2"><select aria-label="Assign to" value={assigneeCode} onChange={(event) => setAssigneeCode(event.target.value)} className="h-11 w-full appearance-none rounded-full border border-input bg-background px-4 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"><option value="">Unassigned</option>{teammates.map((item) => <option key={item.code} value={item.code}>{item.name} · {item.role}</option>)}</select><ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" /></div></div> : null}<div className="rounded-2xl bg-muted p-3"><p className="text-xs text-muted-foreground">Default ownership</p><p className="mt-1 text-sm font-bold">{assignee ? assignee.name : "Unassigned"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{assignee ? `Every imported lead lands in ${assignee.name.split(" ")[0]}\u2019s queue and they get notified.` : "Assign leads after import or distribute them from the Leads list."}</p></div></div></Surface></div>{numbers.length ? <Surface><SurfaceHeader><div><SurfaceTitle>Import preview</SurfaceTitle><p className="mt-1 text-sm text-muted-foreground">{numbers.length} valid numbers found in your paste.</p></div><span className={cn(chipClass, "bg-success/12 text-success")}>{newCount} new</span></SurfaceHeader><ul className="mt-5 divide-y divide-border">{numbers.map((number) => { const existing = existingNumbers.has(number); return <li key={number} className="flex items-center gap-3 py-3"><span className="grid size-10 place-items-center rounded-full bg-accent text-primary"><Phone className="size-4" strokeWidth={1.75} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">+{number}</span><span className="block text-xs text-muted-foreground">{campaign?.name} · {campaign?.project}</span></span><span className={cn(chipClass, existing ? "bg-warning/12 text-warning" : "bg-success/12 text-success")}>{existing ? "Already exists" : "New"}</span></li>; })}</ul>{error ? <p className="mt-3 text-sm font-semibold text-destructive">{error}</p> : null}<button type="button" onClick={submit} disabled={!newCount || !campaign || pending} className={cn(primaryPillClass, "mt-5 h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-50")}><FileUp className="size-4" strokeWidth={1.75} />{pending ? "Importing…" : `Import ${newCount} new leads`}</button></Surface> : <Surface><div className="grid min-h-48 place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary"><Sparkles className="size-5" strokeWidth={1.75} /></span><p className="mt-3 text-sm font-bold">Your preview will appear here</p><p className="mt-1 text-xs text-muted-foreground">Paste phone numbers to check duplicates before importing.</p></div></div></Surface>}</div>;
}

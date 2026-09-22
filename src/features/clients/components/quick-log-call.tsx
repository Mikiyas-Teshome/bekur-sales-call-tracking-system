"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronDown, PhoneCall } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { primaryPillClass, softPillClass } from "@/components/shared/pill";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { cn } from "@/lib/utils";
import type { Lead } from "@/features/clients/fixtures/leads.fixture";
import { logCallAction } from "@/actions/calls";
import { CallOutcome, PipelineStage, callOutcomeGroups, pipelineStageGroups } from "@/entities/enums";

const selectClass = "h-11 w-full appearance-none rounded-full border border-input bg-background px-4 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

const pipelineStageValues = new Set<string>(Object.values(PipelineStage));

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type QuickLogCallProps = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CallForm({ lead, onComplete }: { lead: Lead; onComplete: () => void }) {
  const [outcome, setOutcome] = useState<CallOutcome>(CallOutcome.ANSWERED_INTERESTED);
  // Start from the lead's current stage so a call that doesn't move the deal saves without re-picking it.
  const [stage, setStage] = useState<PipelineStage>(pipelineStageValues.has(lead.stage) ? (lead.stage as PipelineStage) : PipelineStage.ATTEMPTED_CONTACT);
  const [followUp, setFollowUp] = useState("");
  const [calledAt, setCalledAt] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await logCallAction({
        clientCode: lead.id,
        outcome,
        outcomeNote: note,
        pipelineStageAfter: stage,
        nextFollowUpDate: followUp || undefined,
        calledAt: calledAt || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      router.refresh();
    });
  };

  if (submitted) {
    return (
      <div className="grid min-h-80 place-items-center px-5 pb-5 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/12 text-success">
            <Check className="size-6" strokeWidth={2.25} />
          </span>
          <h3 className="mt-4 text-xl font-bold tracking-tight">Call logged</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{lead.name}&apos;s timeline and follow-up queue have been updated.</p>
          <button type="button" onClick={onComplete} className={cn(primaryPillClass, "mt-6 h-11 px-5 text-sm")}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-5 pb-5">
      <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
        <span className="grid size-10 place-items-center rounded-full bg-accent text-sm font-bold text-primary">{lead.initials}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {lead.business} · {lead.phone}
          </p>
        </div>
        <a href={`tel:${lead.phone.replaceAll(/\D/g, "")}`} aria-label={`Call ${lead.name}`} className={cn(softPillClass, "ml-auto size-10 shrink-0 p-0")}>
          <PhoneCall className="size-4" strokeWidth={1.75} />
        </a>
      </div>
      <fieldset>
        <label className="text-sm font-bold" htmlFor="outcome">
          Outcome
        </label>
        <div className="relative mt-2">
          <select id="outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as CallOutcome)} className={selectClass}>
            {callOutcomeGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.outcomes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </fieldset>
      <fieldset>
        <label className="text-sm font-bold" htmlFor="note">
          Outcome note
        </label>
        <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-24 rounded-2xl bg-background" placeholder="What happened on the call?" />
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <label className="text-sm font-bold" htmlFor="called-at">
            Call time
          </label>
          <input
            id="called-at"
            type="datetime-local"
            value={calledAt}
            onChange={(event) => setCalledAt(event.target.value)}
            className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </fieldset>
        <fieldset>
          <label className="text-sm font-bold" htmlFor="stage">
            Pipeline stage
          </label>
          <div className="relative mt-2">
            <select id="stage" value={stage} onChange={(event) => setStage(event.target.value as PipelineStage)} className={selectClass}>
              {pipelineStageGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.stages.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </fieldset>
        <fieldset>
          <label className="text-sm font-bold" htmlFor="follow-up">
            Next follow-up
          </label>
          <input id="follow-up" type="date" value={followUp} onChange={(event) => setFollowUp(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
        </fieldset>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setFollowUp(daysFromNow(3))} className={cn(softPillClass, "h-8 px-3 text-xs")}>
          +3 days
        </button>
        <button type="button" onClick={() => setFollowUp(daysFromNow(7))} className={cn(softPillClass, "h-8 px-3 text-xs")}>
          +1 week
        </button>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-4" />
          Follow-up reminder
        </span>
      </div>
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
      <button type="button" disabled={pending || note.trim().length === 0} onClick={submit} className={cn(primaryPillClass, "h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-50")}>
        {pending ? "Saving…" : "Save call"}
      </button>
    </div>
  );
}

export function QuickLogCall({ lead, open, onOpenChange }: QuickLogCallProps) {
  if (!lead) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Log a call" description="Capture the outcome while the conversation is fresh.">
      <CallForm key={lead.id} lead={lead} onComplete={() => onOpenChange(false)} />
    </ResponsiveDialog>
  );
}

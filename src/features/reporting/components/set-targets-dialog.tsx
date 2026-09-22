"use client";

import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { TargetsForm } from "./targets-form";

export type TargetPerson = { code: string; name: string };

export function SetTargetsDialog({ person, open, onOpenChange, initialPeriod }: { person: TargetPerson | null; open: boolean; onOpenChange: (open: boolean) => void; initialPeriod?: string }) {
  if (!person) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Monthly targets" description="Set the numbers this person is working toward. Progress shows up on reports as calls are logged.">
      <div className="px-5 pb-5">
        <TargetsForm key={person.code} userCode={person.code} userName={person.name} initialPeriod={initialPeriod} />
      </div>
    </ResponsiveDialog>
  );
}

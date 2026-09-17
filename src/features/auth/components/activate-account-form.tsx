"use client";

import { UserCheck } from "lucide-react";
import { teamMembers } from "@/features/team/fixtures/team.fixture";
import { SetPasswordForm } from "./set-password-form";

export function ActivateAccountForm() {
  const invitedMember = teamMembers.find((member) => member.status === "Invited") ?? teamMembers[0];

  return (
    <>
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-muted p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{invitedMember.initials}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Welcome, {invitedMember.name.split(" ")[0]}</p>
          <p className="truncate text-xs text-muted-foreground">{invitedMember.email}</p>
        </div>
      </div>
      <SetPasswordForm
        icon={UserCheck}
        heading="Activate your account"
        description={`Set a password to join ${invitedMember.role === "Sales Rep" ? "as a sales rep" : "the workspace"}.`}
        submitLabel="Activate account"
        successTitle="Account activated"
        successDescription="Your account is ready. Sign in to start working your leads."
      />
    </>
  );
}

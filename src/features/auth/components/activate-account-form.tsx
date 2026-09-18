"use client";

import { UserCheck } from "lucide-react";
import { activateAccountAction } from "@/actions/auth";
import { SetPasswordForm } from "./set-password-form";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ActivateAccountForm({ token, fullName, email, roleName }: { token: string; fullName: string; email: string; roleName: string }) {
  return (
    <>
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-muted p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{initialsOf(fullName)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Welcome, {fullName.split(" ")[0]}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <SetPasswordForm
        icon={UserCheck}
        heading="Activate your account"
        description={`Set a password to join as a ${roleName}.`}
        submitLabel="Activate account"
        successTitle="Account activated"
        successDescription="Your account is ready. Sign in to start working your leads."
        onSubmit={(password) => activateAccountAction({ token, password })}
      />
    </>
  );
}

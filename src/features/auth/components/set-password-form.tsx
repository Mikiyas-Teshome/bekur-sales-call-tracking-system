"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check, Loader2, type LucideIcon } from "lucide-react";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";

const fieldClass = "mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type SetPasswordFormProps = {
  heading: string;
  description: string;
  submitLabel: string;
  successTitle: string;
  successDescription: string;
  icon: LucideIcon;
  onSubmit: (password: string) => Promise<{ ok: boolean; error?: string }>;
};

export function SetPasswordForm({ heading, description, submitLabel, successTitle, successDescription, icon: Icon, onSubmit }: SetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) {
      setError("Fill in both password fields.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await onSubmit(password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Try again.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/12 text-success">
          <Icon className="size-6" strokeWidth={2.25} />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight">{successTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{successDescription}</p>
        <Link href="/login" className={cn(primaryPillClass, "mt-6 inline-flex h-11 px-5 text-sm")}>
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="text-xl font-bold tracking-tight">{heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm font-bold" htmlFor="new-password">
          New password
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className={cn(fieldClass, error && "border-destructive focus-visible:ring-destructive/30")}
          />
        </label>
        <label className="block text-sm font-bold" htmlFor="confirm-password">
          Confirm password
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
            className={cn(fieldClass, error && "border-destructive focus-visible:ring-destructive/30")}
          />
        </label>
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
      </div>

      <button type="submit" disabled={loading} className={cn(primaryPillClass, "mt-6 h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-70")}>
        {loading ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <Check className="size-4" strokeWidth={2.25} />}
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

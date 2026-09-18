"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { requestPasswordResetAction } from "@/actions/auth";

const fieldClass = "mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter the email on your account.");
      return;
    }
    setError(null);
    setLoading(true);
    await requestPasswordResetAction({ email });
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success/12 text-success">
          <MailCheck className="size-6" strokeWidth={2.25} />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          If an account exists for <span className="font-semibold text-foreground">{email}</span>, a reset link is on its way.
        </p>
        <Link href="/login" className={cn(primaryPillClass, "mt-6 inline-flex h-11 px-5 text-sm")}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to sign in
      </Link>
      <h1 className="mt-3 text-xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">We&apos;ll email you a link to choose a new one.</p>

      <label className="mt-5 block text-sm font-bold" htmlFor="forgot-email">
        Work email
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@bekur.app"
          className={cn(fieldClass, error && "border-destructive focus-visible:ring-destructive/30")}
          aria-invalid={Boolean(error)}
        />
        {error ? <span className="mt-1.5 block text-xs font-normal text-destructive">{error}</span> : null}
      </label>

      <button type="submit" disabled={loading} className={cn(primaryPillClass, "mt-6 h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-70")}>
        {loading ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <Mail className="size-4" strokeWidth={1.75} />}
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

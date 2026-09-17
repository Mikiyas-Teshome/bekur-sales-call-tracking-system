"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, LogIn, TriangleAlert } from "lucide-react";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";

const fieldClass = "mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const errorFieldClass = "border-destructive focus-visible:ring-destructive/30";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Enter your work email.";
    if (!password.trim()) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    setAuthError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    const result = await signIn("credentials", { email: email.trim(), password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setAuthError("That email or password doesn't look right.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Access your sales workspace.</p>

      {authError ? (
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          <span>{authError}</span>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <label className="block text-sm font-bold" htmlFor="login-email">
          Work email
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@bekur.app"
            className={cn(fieldClass, errors.email && errorFieldClass)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <span className="mt-1.5 block text-xs font-normal text-destructive">{errors.email}</span> : null}
        </label>
        <label className="block text-sm font-bold" htmlFor="login-password">
          Password
          <span className="relative mt-2 block">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={cn(fieldClass, "mt-0 pr-11", errors.password && errorFieldClass)}
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
            </button>
          </span>
          {errors.password ? <span className="mt-1.5 block text-xs font-normal text-destructive">{errors.password}</span> : null}
        </label>
      </div>

      <div className="mt-3 flex justify-end">
        <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <button type="submit" disabled={loading} className={cn(primaryPillClass, "mt-6 h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-70")}>
        {loading ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <LogIn className="size-4" strokeWidth={1.75} />}
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

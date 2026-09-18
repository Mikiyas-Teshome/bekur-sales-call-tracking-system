import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { AuthTokenType } from "@/entities";
import { peekAuthToken } from "@/lib/auth-tokens";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const recipient = token ? await peekAuthToken(token, AuthTokenType.PASSWORD_RESET) : null;

  if (!token || !recipient) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/12 text-destructive">
          <CircleAlert className="size-6" strokeWidth={2.25} />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight">This reset link is invalid</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">It may have expired or already been used. Request a new one from the sign-in page.</p>
        <Link href="/forgot-password" className={cn(primaryPillClass, "mt-6 inline-flex h-11 px-5 text-sm")}>
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

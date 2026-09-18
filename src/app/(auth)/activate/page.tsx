import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { AuthTokenType } from "@/entities";
import { peekAuthToken } from "@/lib/auth-tokens";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { ActivateAccountForm } from "@/features/auth/components/activate-account-form";

export default async function ActivateAccountPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const recipient = token ? await peekAuthToken(token, AuthTokenType.INVITE) : null;

  if (!token || !recipient) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/12 text-destructive">
          <CircleAlert className="size-6" strokeWidth={2.25} />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight">This invitation link is invalid</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">It may have expired or already been used. Ask an administrator to send you a new invite.</p>
        <Link href="/login" className={cn(primaryPillClass, "mt-6 inline-flex h-11 px-5 text-sm")}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return <ActivateAccountForm token={token} fullName={recipient.fullName} email={recipient.email} roleName={recipient.roleName} />;
}

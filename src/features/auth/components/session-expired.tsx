import Link from "next/link";
import { TimerOff } from "lucide-react";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";

export function SessionExpired() {
  return (
    <div className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-warning/12 text-warning">
        <TimerOff className="size-6" strokeWidth={2.25} />
      </span>
      <h1 className="mt-4 text-xl font-bold tracking-tight">Your session has expired</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">For your security, you were signed out after a period of inactivity. Sign in again to pick up where you left off.</p>
      <Link href="/login" className={cn(primaryPillClass, "mt-6 inline-flex h-11 px-5 text-sm")}>
        Sign in again
      </Link>
    </div>
  );
}

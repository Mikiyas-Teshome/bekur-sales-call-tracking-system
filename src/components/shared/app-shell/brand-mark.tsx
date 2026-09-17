import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className, withName = false }: { className?: string; withName?: boolean }) {
  return (
    <Link href="/" aria-label="Bekur home" className={cn("flex items-center gap-3", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_var(--primary)]">
        <PhoneCall className="size-[18px]" strokeWidth={2.25} />
      </span>
      {withName ? (
        <span className="leading-tight">
          <span className="block text-base font-bold">Bekur</span>
          <span className="block text-xs text-canvas-muted">Sales workspace</span>
        </span>
      ) : null}
    </Link>
  );
}

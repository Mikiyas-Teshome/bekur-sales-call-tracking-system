import Link from "next/link";
import { cn } from "@/lib/utils";
import { BekurLogo } from "./bekur-logo";

export function BrandMark({ className, withName = false }: { className?: string; withName?: boolean }) {
  return (
    <Link href="/" aria-label="Bekur home" className={cn("flex items-center gap-3", className)}>
      <BekurLogo />
      {withName ? (
        <span className="leading-tight">
          <span className="block text-base font-bold">Bekur</span>
          <span className="block text-xs text-canvas-muted">Sales workspace</span>
        </span>
      ) : null}
    </Link>
  );
}

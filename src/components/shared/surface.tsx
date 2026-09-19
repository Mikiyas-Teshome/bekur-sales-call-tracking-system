import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = ComponentProps<"section"> & {
  tone?: "light" | "primary";
};

export function Surface({ tone = "light", className, ...props }: SurfaceProps) {
  return (
    <section
      data-tone={tone}
      className={cn(
        "min-w-0 rounded-3xl p-5",
        tone === "light"
          ? "border border-border bg-card text-card-foreground"
          : "bg-[linear-gradient(135deg,var(--primary-deep),var(--primary)_60%,color-mix(in_oklch,var(--primary),white_18%))] text-white",
        className,
      )}
      {...props}
    />
  );
}

export function SurfaceHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center justify-between gap-3", className)} {...props} />;
}

export function SurfaceTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-bold tracking-tight", className)} {...props} />;
}

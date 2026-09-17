"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export const themeOptions: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ tone = "light", className }: { tone?: "light" | "ink"; className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn("grid grid-cols-3 gap-1 rounded-full p-1", tone === "ink" ? "bg-white/8" : "bg-muted", className)}
    >
      {themeOptions.map(({ value, label, icon: Icon }) => {
        const selected = theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              tone === "ink"
                ? selected
                  ? "bg-white text-ink"
                  : "text-ink-muted hover:text-ink-foreground"
                : selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

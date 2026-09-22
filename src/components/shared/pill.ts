export const primaryPillClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_var(--primary)] transition-all outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98]";

export const softPillClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-foreground transition-colors outline-none hover:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98]";

export const chipClass = "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold";

// Chip colors keyed by StatusTone from src/entities/enums.ts (pipelineStageTone / callOutcomeTone).
export const toneChipClasses = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  destructive: "bg-destructive/12 text-destructive",
  muted: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
} as const;

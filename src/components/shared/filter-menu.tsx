"use client";

import { useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { softPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";

type FilterMenuProps = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
  widthClassName?: string;
};

export function FilterMenu({ label, value, options, onChange, icon: Icon, widthClassName = "max-w-44" }: FilterMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative hidden md:block">
        <button
          type="button"
          aria-label={`${label} filter`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={cn(softPillClass, "h-9 px-3 text-xs", widthClassName)}
        >
          {Icon ? <Icon className="size-4" strokeWidth={1.75} /> : null}
          <span className="truncate">{value}</span>
          <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} strokeWidth={1.75} />
        </button>
        {open ? (
          <div role="listbox" aria-label={`${label} options`} className="absolute top-[calc(100%+0.5rem)] right-0 z-30 min-w-48 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-float">
            <p className="px-3 py-2 text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">{label}</p>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === value}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors hover:bg-muted",
                  option === value ? "bg-accent font-bold text-accent-foreground" : "text-foreground",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{option}</span>
                {option === value ? <Check className="size-4 shrink-0 text-primary" strokeWidth={2.25} /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <label className={cn(softPillClass, "h-9 px-3 text-xs md:hidden", widthClassName)}>
        {Icon ? <Icon className="size-4" strokeWidth={1.75} /> : null}
        <span className="sr-only">{label}</span>
        <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="max-w-32 appearance-none bg-transparent outline-none">
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="size-3.5 shrink-0" strokeWidth={1.75} />
      </label>
    </>
  );
}

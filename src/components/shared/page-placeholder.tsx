import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";

type PagePlaceholderProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: string;
};

export function PagePlaceholder({ icon: Icon = Sparkles, title, description, action }: PagePlaceholderProps) {
  return (
    <section className="grid min-h-[60dvh] place-items-center">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-primary">
          <Icon className="size-7" strokeWidth={1.75} />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? (
          <button type="button" className={cn(primaryPillClass, "mt-6 h-11 px-5 text-sm")}>
            {action}
          </button>
        ) : null}
      </div>
    </section>
  );
}

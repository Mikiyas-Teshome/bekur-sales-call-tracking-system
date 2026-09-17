"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { useLauncher } from "./launcher-context";
import { pageTitleFor } from "./navigation";
import { UserMenu } from "./user-menu";

export const circleButtonClass =
  "grid size-11 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95";

export const pillButtonClass = cn(primaryPillClass, "h-11 px-5 text-sm");

function NotificationsButton() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button type="button" aria-label="Notifications" className={cn(circleButtonClass, "relative")}>
            <Bell className="size-5" strokeWidth={1.75} />
            <span className="absolute top-3 right-3 size-2 rounded-full bg-primary ring-2 ring-muted" />
          </button>
        }
      />
      <TooltipContent sideOffset={8}>Notifications</TooltipContent>
    </Tooltip>
  );
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Toggle light or dark theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={circleButtonClass}
          >
            <Sun className="size-5 dark:hidden" strokeWidth={1.75} />
            <Moon className="hidden size-5 dark:block" strokeWidth={1.75} />
          </button>
        }
      />
      <TooltipContent sideOffset={8}>Switch theme</TooltipContent>
    </Tooltip>
  );
}

export function WorkspaceHeader({ onOpenDock }: { onOpenDock: () => void }) {
  const pathname = usePathname();
  const { setOpen } = useLauncher();
  const title = pageTitleFor(pathname);

  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-md lg:static lg:bg-transparent lg:backdrop-blur-none">
      <div className="flex h-16 items-center gap-3 px-4 lg:hidden">
        <button type="button" aria-label="Open navigation" onClick={onOpenDock} className={cn(circleButtonClass, "relative z-30 touch-manipulation")}>
          <Menu className="size-5" strokeWidth={1.75} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight">{title}</h1>
        <button type="button" aria-label="Search" onClick={() => setOpen(true)} className={cn(circleButtonClass, "relative z-30 touch-manipulation")}>
          <Search className="size-5" strokeWidth={1.75} />
        </button>
        <NotificationsButton />
        <button
          type="button"
          aria-label="Log a call"
          className={cn(primaryPillClass, "size-11 shrink-0 rounded-full p-0")}
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="hidden h-24 items-center gap-4 px-8 lg:flex">
        <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-64 items-center gap-3 rounded-full bg-muted pr-3 pl-4 text-sm text-muted-foreground transition-[width,background-color] outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring/40 xl:w-80"
          >
            <Search className="size-4.5" strokeWidth={1.75} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded-md bg-background px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground shadow-sm">Ctrl K</kbd>
          </button>
          <ThemeButton />
          <NotificationsButton />
          <UserMenu />
          <button type="button" className={cn(pillButtonClass, "ml-1")}>
            <Plus className="size-4" strokeWidth={2.5} />
            Log call
          </button>
        </div>
      </div>
    </header>
  );
}

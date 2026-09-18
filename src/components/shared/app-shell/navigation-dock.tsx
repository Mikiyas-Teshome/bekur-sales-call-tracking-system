"use client";

import { signOutWithPushCleanup } from "@/lib/sign-out";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { isCurrentPath, navigationFor, settingsNavigation, type NavigationItem } from "./navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { RolePreviewToggle, useRolePreview } from "@/components/shared/role-preview";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserAvatar } from "./user-menu";

function DockLink({ item, current, onNavigate }: { item: NavigationItem; current: boolean; onNavigate: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex h-12 items-center gap-3 rounded-full pr-4 pl-1.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        current ? "bg-white/12 text-canvas-foreground" : "text-canvas-muted hover:bg-white/6 hover:text-canvas-foreground",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-full", current ? "bg-primary text-primary-foreground" : "bg-white/6")}>
        <Icon className="size-[18px]" strokeWidth={current ? 2.25 : 1.75} />
      </span>
      {item.label}
      <ChevronRight className="ml-auto size-4 opacity-40" />
    </Link>
  );
}

export function NavigationDock({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname();
  const { effectivePermissions, effectiveRoleName } = useRolePreview();
  const currentUser = useCurrentUser();
  const navigation = navigationFor(effectivePermissions);
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[300px] max-w-[85vw] gap-0 rounded-r-[28px] border-0 bg-canvas p-0 text-canvas-foreground shadow-float ring-1 ring-white/10"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Move between areas of the workspace.</SheetDescription>
        <div className="flex h-16 items-center px-4">
          <BrandMark withName />
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation"
            className="ml-auto grid size-11 place-items-center rounded-full text-canvas-muted transition-colors hover:bg-white/8 hover:text-canvas-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mx-3 mt-2 flex items-center gap-3 rounded-2xl bg-white/6 p-3">
          <UserAvatar className="size-10" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">{currentUser.name}</span>
            <span className="block truncate text-xs text-canvas-muted">{effectiveRoleName}</span>
          </span>
        </div>

        <nav aria-label="Workspace" className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
          {navigation.map((item) => (
            <DockLink key={item.href} item={item} current={isCurrentPath(pathname, item.href)} onNavigate={close} />
          ))}
          <span className="my-2 h-px bg-white/10" />
          <DockLink item={settingsNavigation} current={isCurrentPath(pathname, settingsNavigation.href)} onNavigate={close} />
        </nav>

        <div className="space-y-2 border-t border-white/10 p-3 safe-bottom">
          <p className="px-1 text-[10px] font-bold tracking-[0.12em] text-canvas-muted uppercase">Preview as</p>
          <RolePreviewToggle tone="ink" />
          <ThemeToggle tone="ink" />
          <button
            type="button"
            onClick={() => signOutWithPushCleanup({ callbackUrl: "/login" })}
            className="flex h-12 w-full items-center gap-3 rounded-full pr-4 pl-1.5 text-sm font-semibold text-canvas-muted transition-colors hover:bg-white/6 hover:text-canvas-foreground"
          >
            <span className="grid size-9 place-items-center rounded-full bg-white/6">
              <LogOut className="size-[18px]" strokeWidth={1.75} />
            </span>
            Log out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

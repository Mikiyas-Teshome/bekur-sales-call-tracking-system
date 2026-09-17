"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { LogOut, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRolePreview } from "@/components/shared/role-preview";
import { isCurrentPath, navigationFor, settingsNavigation, type NavigationItem } from "./navigation";

const expandDelayMs = 150;

const railItemClass =
  "flex h-11 w-11 items-center overflow-hidden rounded-full text-canvas-muted transition-[width,background-color,color] duration-200 outline-none hover:bg-white/8 hover:text-canvas-foreground focus-visible:ring-2 focus-visible:ring-white/40 group-data-[expanded=true]/rail:w-full";

const railLabelClass =
  "translate-x-1 pr-4 text-sm font-semibold whitespace-nowrap opacity-0 transition-[opacity,transform] duration-200 group-data-[expanded=true]/rail:translate-x-0 group-data-[expanded=true]/rail:opacity-100";

function RailLink({ item, current, onNavigate }: { item: NavigationItem; current: boolean; onNavigate: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={current ? "page" : undefined}
      className={cn(railItemClass, current && "bg-white/12 text-canvas-foreground ring-1 ring-white/10")}
    >
      <span className="grid size-11 shrink-0 place-items-center">
        <Icon className="size-5" strokeWidth={current ? 2.25 : 1.75} />
      </span>
      <span className={railLabelClass}>{item.label}</span>
    </Link>
  );
}

export function DesktopRail() {
  const pathname = usePathname();
  const { effectivePermissions } = useRolePreview();
  const navigation = navigationFor(effectivePermissions);
  const [expanded, setExpanded] = useState(false);
  const [restUntilLeave, setRestUntilLeave] = useState(false);
  const expandTimer = useRef<number | null>(null);

  const cancelPendingExpand = () => {
    if (expandTimer.current !== null) window.clearTimeout(expandTimer.current);
    expandTimer.current = null;
  };

  const handleEnter = () => {
    if (restUntilLeave) return;
    cancelPendingExpand();
    expandTimer.current = window.setTimeout(() => setExpanded(true), expandDelayMs);
  };

  const handleLeave = () => {
    cancelPendingExpand();
    setExpanded(false);
    setRestUntilLeave(false);
  };

  const collapseAfterNavigate = () => {
    cancelPendingExpand();
    setExpanded(false);
    setRestUntilLeave(true);
  };

  return (
    <aside
      data-expanded={expanded}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={() => !restUntilLeave && setExpanded(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setExpanded(false)}
      className="group/rail fixed inset-y-0 left-0 z-40 hidden w-20 flex-col bg-canvas px-[18px] py-5 transition-[width] duration-200 data-[expanded=true]:w-60 lg:flex"
    >
      <Link href="/" aria-label="Bekur home" onClick={collapseAfterNavigate} className={cn(railItemClass, "text-canvas-foreground hover:bg-transparent")}>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_var(--primary)]">
          <PhoneCall className="size-4.5" strokeWidth={2.25} />
        </span>
        <span className={cn(railLabelClass, "leading-tight")}>
          <span className="block text-base font-bold">Bekur</span>
          <span className="block text-xs font-medium text-canvas-muted">Sales workspace</span>
        </span>
      </Link>

      <nav aria-label="Primary" className="my-auto flex flex-col gap-1.5">
        {navigation.map((item) => (
          <RailLink key={item.href} item={item} current={isCurrentPath(pathname, item.href)} onNavigate={collapseAfterNavigate} />
        ))}
        <span className="my-2 ml-[10px] h-px w-6 bg-white/10" />
        <RailLink item={settingsNavigation} current={isCurrentPath(pathname, settingsNavigation.href)} onNavigate={collapseAfterNavigate} />
      </nav>

      <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className={railItemClass}>
        <span className="grid size-11 shrink-0 place-items-center">
          <LogOut className="size-5" strokeWidth={1.75} />
        </span>
        <span className={railLabelClass}>Log out</span>
      </button>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isCurrentPath, mobileTabs, type NavigationItem } from "./navigation";

function ExpandingTab({ item, current }: { item: NavigationItem; current: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      aria-label={item.label}
      style={{ flexGrow: current ? 1 : 0 }}
      className={cn(
        "flex h-12 min-w-12 basis-12 items-center justify-center overflow-hidden rounded-full transition-[flex-grow,background-color,color] duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95",
        current ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-5.5 shrink-0" strokeWidth={current ? 2.25 : 1.75} />
      <span
        className={cn(
          "overflow-hidden text-sm font-semibold whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-out",
          current ? "ml-2 max-w-28 opacity-100" : "ml-0 max-w-0 opacity-0",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="fixed inset-x-4 bottom-[max(env(safe-area-inset-bottom),1rem)] z-30 lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-full border border-border/80 bg-background/90 p-1.5 shadow-float backdrop-blur-xl supports-backdrop-filter:bg-background/75">
        {mobileTabs.map((item) => (
          <ExpandingTab key={item.href} item={item} current={isCurrentPath(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}

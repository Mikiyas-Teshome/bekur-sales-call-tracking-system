"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { softPillClass } from "@/components/shared/pill";

function buildPageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  const window = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const pages = [...window].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) result.push("ellipsis");
    result.push(pages[i]);
  }
  return result;
}

export function PaginationControls({ page, totalPages, total, pageSize }: { page: number; totalPages: number; total: number; pageSize: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefForPage = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        {start}–{end} of {total}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5">
          <Link
            href={hrefForPage(Math.max(1, page - 1))}
            aria-label="Previous page"
            aria-disabled={page === 1}
            className={cn(softPillClass, "size-9 p-0", page === 1 && "pointer-events-none opacity-40")}
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </Link>
          {buildPageWindow(page, totalPages).map((entry, index) =>
            entry === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                key={entry}
                href={hrefForPage(entry)}
                aria-current={entry === page ? "page" : undefined}
                className={cn(softPillClass, "h-9 min-w-9 px-2.5 text-xs", entry === page && "bg-primary text-primary-foreground hover:bg-primary")}
              >
                {entry}
              </Link>
            ),
          )}
          <Link
            href={hrefForPage(Math.min(totalPages, page + 1))}
            aria-label="Next page"
            aria-disabled={page === totalPages}
            className={cn(softPillClass, "size-9 p-0", page === totalPages && "pointer-events-none opacity-40")}
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </Link>
        </div>
      ) : null}
    </nav>
  );
}

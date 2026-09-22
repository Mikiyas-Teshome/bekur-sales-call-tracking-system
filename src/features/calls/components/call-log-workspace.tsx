"use client";

import Link from "next/link";
import { PhoneCall, Search, SearchX } from "lucide-react";
import { FilterMenu } from "@/components/shared/filter-menu";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { chipClass, toneChipClasses } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { useSearchParamsUpdater } from "@/lib/use-search-params-updater";
import { useDebouncedSearchFilter } from "@/lib/use-debounced-search-filter";
import type { Paginated } from "@/lib/pagination";
import type { CallLogRow } from "@/services/calls.service";
import { callOutcomeTone } from "@/entities/enums";

type RepOption = { code: string; name: string };
type Filters = { search: string; outcome: string; rep: string };

const outcomeTone = (outcome: string) => toneChipClasses[callOutcomeTone(outcome)];

export function CallLogWorkspace({
  result,
  repOptions,
  outcomeOptions,
  filters,
}: {
  result: Paginated<CallLogRow>;
  repOptions: RepOption[];
  outcomeOptions: string[];
  filters: Filters;
}) {
  const calls = result.items;
  const updateParams = useSearchParamsUpdater();
  const [searchInput, setSearchInput] = useDebouncedSearchFilter(filters.search);

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="pt-2 lg:pt-0">
        <p className="text-sm font-medium text-primary">Activity</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Call log</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every call made across the workspace, newest first.</p>
      </section>

      <Surface>
        <SurfaceHeader className="items-start">
          <div>
            <SurfaceTitle>All calls</SurfaceTitle>
            <p className="mt-1 text-sm text-muted-foreground">{result.total} calls match your current view</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <FilterMenu label="Outcome" value={filters.outcome} options={["All outcomes", ...outcomeOptions]} onChange={(value) => updateParams({ outcome: value === "All outcomes" ? null : value })} />
            <FilterMenu label="Rep" value={repOptions.find((rep) => rep.code === filters.rep)?.name ?? "All reps"} options={["All reps", ...repOptions.map((rep) => rep.name)]} onChange={(value) => updateParams({ rep: value === "All reps" ? null : (repOptions.find((rep) => rep.name === value)?.code ?? null) })} />
          </div>
        </SurfaceHeader>
        <label className="relative mt-5 block">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <input aria-label="Search calls" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by lead name or phone" className="h-11 w-full rounded-full border border-input bg-background pr-4 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
        </label>
      </Surface>

      {calls.length ? (
        <>
          <Surface className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-240 text-left">
                <thead className="border-b border-border bg-muted/60">
                  <tr className="text-[11px] font-medium text-muted-foreground">
                    <th className="px-5 py-3">Lead</th>
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3">Rep</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-5 py-3 text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {calls.map((call) => (
                    <tr key={call.id} className="text-sm transition-colors hover:bg-muted/55">
                      <td className="px-5 py-3.5">
                        <Link href={`/leads/${call.clientCode}`} className="block">
                          <p className="font-bold">{call.clientName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{call.clientPhone}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(chipClass, outcomeTone(call.outcome))}>{call.outcome}</span>
                        {call.value ? <p className="mt-1 text-xs font-bold text-success">{call.value}</p> : null}
                      </td>
                      <td className="max-w-72 px-4 py-3.5 text-xs text-muted-foreground">
                        <p className="line-clamp-2">{call.note || "—"}</p>
                      </td>
                      <td className="px-4 py-3.5 font-semibold">{call.rep}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {call.campaign}
                        <br />
                        {call.project}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">{call.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>

          <div className="space-y-3 md:hidden">
            {calls.map((call) => (
              <Surface key={call.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/leads/${call.clientCode}`} className="min-w-0">
                    <p className="truncate text-sm font-bold">{call.clientName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{call.clientPhone}</p>
                  </Link>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-primary">
                    <PhoneCall className="size-4" strokeWidth={1.75} />
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={cn(chipClass, outcomeTone(call.outcome))}>{call.outcome}</span>
                  {call.value ? <span className="text-xs font-bold text-success">{call.value}</span> : null}
                </div>
                {call.note ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{call.note}</p> : null}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{call.rep}</span>
                  <span>{call.date}</span>
                </div>
              </Surface>
            ))}
          </div>

          <Surface className="py-3">
            <PaginationControls page={result.page} totalPages={result.totalPages} total={result.total} pageSize={result.pageSize} />
          </Surface>
        </>
      ) : (
        <Surface>
          <div className="grid min-h-52 place-items-center text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary">
                <SearchX className="size-5" strokeWidth={1.75} />
              </span>
              <p className="mt-3 text-sm font-bold">No calls match these filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different outcome, rep, or search term.</p>
            </div>
          </div>
        </Surface>
      )}
    </div>
  );
}

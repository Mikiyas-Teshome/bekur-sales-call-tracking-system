import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/shared/surface";

export default function ReportsLoading() {
  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </section>

      <Skeleton className="h-11 w-full rounded-full" />

      <Surface className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-72" />
        </div>
      </Surface>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Surface key={index} className="p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Surface>
        ))}
      </section>

      <Surface>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-1 h-3 w-64" />
        <Skeleton className="mt-8 h-48 w-full rounded-2xl" />
      </Surface>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
        {Array.from({ length: 2 }).map((_, index) => (
          <Surface key={index}>
            <Skeleton className="h-5 w-36" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 5 }).map((_, row) => (
                <div key={row} className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full rounded-full" />
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </section>
    </div>
  );
}

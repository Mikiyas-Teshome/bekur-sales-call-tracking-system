import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/shared/surface";

export default function CampaignsLoading() {
  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-40 rounded-full" />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Surface key={index} className="p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Surface>
        ))}
      </section>

      <Surface>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="mt-5 h-11 w-full rounded-full" />
      </Surface>

      <Surface className="hidden overflow-hidden p-0 md:block">
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

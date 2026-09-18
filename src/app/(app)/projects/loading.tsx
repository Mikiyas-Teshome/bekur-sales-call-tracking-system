import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/shared/surface";

export default function ProjectsLoading() {
  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-36 rounded-full" />
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
        <Skeleton className="h-5 w-28" />
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </Surface>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Surface key={index} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </Surface>
        ))}
      </section>
    </div>
  );
}

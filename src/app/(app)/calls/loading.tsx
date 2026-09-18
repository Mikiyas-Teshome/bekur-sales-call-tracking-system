import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/shared/surface";

export default function CallLogLoading() {
  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="pt-2 lg:pt-0">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </section>

      <Surface>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
        <Skeleton className="mt-5 h-11 w-full rounded-full" />
      </Surface>

      <Surface className="hidden overflow-hidden p-0 md:block">
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

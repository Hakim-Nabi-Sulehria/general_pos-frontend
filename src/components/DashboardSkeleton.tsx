import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <main className="page-container">
      {/* Header Skeleton */}
      <div className="flex justify-between mb-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* KPI Skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Skeleton className="h-[400px] lg:col-span-4 rounded-xl" />
        <Skeleton className="h-[400px] lg:col-span-3 rounded-xl" />
      </div>
    </main>
  );
}

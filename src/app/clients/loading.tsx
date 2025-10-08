import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'

export default function Loading() {
  return (
    <LenkersdorferSidebar>
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6 animate-pulse">
          <div className="h-8 w-32 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded"></div>
          <div className="h-10 w-24 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded"></div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-12 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded animate-pulse"></div>

        {/* Client Cards Skeleton */}
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900 rounded-lg p-4 space-y-3 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LenkersdorferSidebar>
  )
}

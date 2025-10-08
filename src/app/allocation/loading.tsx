import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'

export default function Loading() {
  return (
    <LenkersdorferSidebar>
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6 animate-pulse">
          <div className="h-8 w-40 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded"></div>
          <div className="h-10 w-32 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded"></div>
        </div>

        {/* Watch Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900 rounded-lg p-4 space-y-3 animate-pulse"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="h-6 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded w-2/3"></div>
              <div className="h-4 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded w-1/2"></div>
              <div className="h-4 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded w-full"></div>
              <div className="h-8 bg-gradient-to-r from-neutral-800 to-neutral-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    </LenkersdorferSidebar>
  )
}

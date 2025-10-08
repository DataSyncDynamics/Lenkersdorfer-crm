import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'

export default function Loading() {
  return (
    <LenkersdorferSidebar>
      <div className="flex-1 p-4 md:p-6 space-y-4 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-8 w-32 bg-neutral-800 rounded mb-6"></div>

        {/* Waitlist Items Skeleton */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-neutral-900 rounded-lg p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-neutral-800 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                <div className="h-3 bg-neutral-800 rounded w-1/3"></div>
              </div>
              <div className="h-6 w-20 bg-neutral-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </LenkersdorferSidebar>
  )
}

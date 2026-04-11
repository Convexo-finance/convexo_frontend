import { SkeletonCard } from '@/components/ui/Skeleton';

export default function TreasuryLoading() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <div className="h-4 w-24 bg-gray-800 rounded animate-pulse mb-3" />
              <div className="h-8 w-32 bg-gray-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

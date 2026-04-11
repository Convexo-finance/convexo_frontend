import { SkeletonCard } from '@/components/ui/Skeleton';

export default function DigitalIdLoading() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>

        {/* NFT cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card space-y-4">
              <div className="h-40 bg-gray-800 rounded-xl animate-pulse" />
              <div className="h-5 w-32 bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-800/60 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-800/40 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

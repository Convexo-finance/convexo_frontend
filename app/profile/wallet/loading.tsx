import { SkeletonCard } from '@/components/ui/Skeleton';

export default function WalletLoading() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-36 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>

        {/* Portfolio value card */}
        <div className="card">
          <div className="h-4 w-24 bg-gray-800 rounded animate-pulse mb-3" />
          <div className="h-10 w-48 bg-gray-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-32 bg-gray-800/40 rounded animate-pulse" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-10 w-24 bg-gray-800 rounded-xl animate-pulse" />
        </div>

        {/* Token list skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-14 bg-gray-800/60 rounded animate-pulse" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-800/60 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

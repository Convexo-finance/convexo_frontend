import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';

/**
 * Profile section loading skeleton.
 * Used by /profile, /profile/wallet, /profile/bank-accounts, /profile/contacts
 */
export default function ProfileLoading() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>

        {/* Identity card skeleton */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-gray-800/60 rounded-lg animate-pulse" />
              <div className="h-6 w-48 bg-gray-800/40 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="h-4 w-20 bg-gray-800 rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-gray-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
        <SkeletonTable rows={6} />
      </div>
    </div>
  );
}

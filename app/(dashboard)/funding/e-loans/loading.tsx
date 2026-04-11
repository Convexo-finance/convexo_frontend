import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';

export default function ModuleLoading() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
        <SkeletonCard />
        <SkeletonTable rows={4} />
      </div>
    </div>
  );
}

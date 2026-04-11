import { SkeletonTable } from '@/components/ui/Skeleton';

export default function ContactsLoading() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
        <SkeletonTable rows={4} />
      </div>
    </div>
  );
}

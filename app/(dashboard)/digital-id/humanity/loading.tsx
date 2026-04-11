export default function VerificationLoading() {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-gray-800/60 rounded-lg animate-pulse" />
        </div>
        <div className="card space-y-6">
          <div className="h-48 bg-gray-800 rounded-xl animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-800/60 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-800/60 rounded animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

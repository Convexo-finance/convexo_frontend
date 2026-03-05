export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto p-8 space-y-8">
        {/* Progress bar skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-1.5 flex-1 bg-gray-800 rounded-full animate-pulse" />
          ))}
        </div>

        <div className="card space-y-6">
          <div className="h-6 w-48 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-gray-800/60 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-800/40 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-800/40 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

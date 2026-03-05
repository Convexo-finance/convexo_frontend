export function WalletSkeleton() {
  return (
    <div className="p-8">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-28 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-9 w-20 bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-36 bg-white/10 rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-white/10 rounded-full animate-pulse" />
        </div>
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5 space-y-2">
          <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-9 w-44 bg-white/10 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="space-y-1.5 items-end flex flex-col">
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-14 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

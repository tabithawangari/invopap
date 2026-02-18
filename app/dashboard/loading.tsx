// app/dashboard/loading.tsx — Dashboard skeleton loader
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-mist/30">
      {/* Top bar skeleton */}
      <div className="bg-white border-b border-mist">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="h-7 w-24 bg-mist rounded animate-pulse" />
          <div className="h-8 w-32 bg-mist rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-mist p-5 space-y-2"
            >
              <div className="h-3 w-20 bg-mist rounded animate-pulse" />
              <div className="h-8 w-16 bg-mist rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-xl border border-mist p-6 space-y-4">
          <div className="h-5 w-32 bg-mist rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-mist last:border-0">
              <div className="h-4 w-24 bg-mist rounded animate-pulse" />
              <div className="h-4 w-32 bg-mist rounded animate-pulse" />
              <div className="h-4 w-20 bg-mist rounded animate-pulse flex-1" />
              <div className="h-4 w-16 bg-mist rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

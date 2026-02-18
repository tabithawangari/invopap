// app/loading.tsx — Editor skeleton loader for instant feedback
export default function EditorLoading() {
  return (
    <div className="min-h-screen bg-mist/30 animate-pulse">
      {/* Header bar */}
      <div className="bg-white border-b border-mist">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="h-7 w-28 bg-mist rounded" />
          <div className="flex gap-3">
            <div className="h-8 w-20 bg-mist rounded" />
            <div className="h-8 w-24 bg-mist rounded" />
          </div>
        </div>
      </div>

      {/* Two-column editor layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left: form area */}
          <div className="flex-1 space-y-4">
            <div className="bg-white rounded-xl border border-mist p-6 space-y-4">
              <div className="h-5 w-40 bg-mist rounded" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-mist rounded" />
                <div className="h-10 bg-mist rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-12 bg-mist rounded" />
                  <div className="h-20 bg-mist rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-12 bg-mist rounded" />
                  <div className="h-20 bg-mist rounded" />
                </div>
              </div>
              {/* Line items skeleton */}
              <div className="space-y-2 pt-4">
                <div className="h-4 w-24 bg-mist rounded" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-10 flex-1 bg-mist rounded" />
                    <div className="h-10 w-20 bg-mist rounded" />
                    <div className="h-10 w-20 bg-mist rounded" />
                    <div className="h-10 w-24 bg-mist rounded" />
                  </div>
                ))}
              </div>
              {/* Totals skeleton */}
              <div className="flex justify-end pt-4">
                <div className="space-y-2 w-48">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-mist rounded" />
                    <div className="h-3 w-20 bg-mist rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-12 bg-mist rounded" />
                    <div className="h-3 w-20 bg-mist rounded" />
                  </div>
                  <div className="flex justify-between pt-2 border-t border-mist">
                    <div className="h-4 w-14 bg-mist rounded" />
                    <div className="h-4 w-24 bg-mist rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: sidebar area (hidden on mobile) */}
          <div className="hidden lg:block w-64 space-y-4">
            <div className="bg-white rounded-xl border border-mist p-4 space-y-4">
              <div className="h-9 bg-mist rounded" />
              <div className="h-9 bg-mist rounded" />
              <hr className="border-mist" />
              <div className="h-3 w-16 bg-mist rounded" />
              <div className="h-9 bg-mist rounded" />
              <div className="h-3 w-20 bg-mist rounded" />
              <div className="flex flex-wrap gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-7 w-7 bg-mist rounded-full" />
                ))}
              </div>
              <div className="h-3 w-16 bg-mist rounded" />
              <div className="h-9 bg-mist rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

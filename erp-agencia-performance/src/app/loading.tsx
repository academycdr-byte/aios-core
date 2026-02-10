export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-lg bg-bg-secondary animate-pulse" />
        <div className="h-4 w-64 rounded-lg bg-bg-secondary animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-bg-secondary animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded bg-bg-secondary animate-pulse" />
                <div className="h-6 w-28 rounded bg-bg-secondary animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-80 rounded-xl border border-border bg-bg-card animate-pulse" />
    </div>
  )
}

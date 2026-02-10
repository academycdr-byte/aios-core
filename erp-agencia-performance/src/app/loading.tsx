export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 rounded bg-bg-secondary animate-pulse" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[88px] rounded-xl border border-border bg-bg-card animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[360px] rounded-xl border border-border bg-bg-card animate-pulse" />
        <div className="h-[360px] rounded-xl border border-border bg-bg-card animate-pulse" />
      </div>
    </div>
  )
}

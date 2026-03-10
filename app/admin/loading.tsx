export default function AdminLoading() {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-9 w-48 animate-pulse rounded bg-surface-elevated" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-surface-elevated" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded bg-surface-elevated" />
      </div>

      <div className="overflow-hidden rounded border border-border-custom">
        <div className="border-b border-border-custom bg-surface px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-surface-elevated" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border-custom bg-surface-elevated px-4 py-3"
          >
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface" />
            <div className="h-4 w-16 animate-pulse rounded bg-surface" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface" />
            <div className="h-4 w-10 animate-pulse rounded bg-surface" />
            <div className="ml-auto flex gap-2">
              <div className="h-7 w-14 animate-pulse rounded bg-surface" />
              <div className="h-7 w-16 animate-pulse rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

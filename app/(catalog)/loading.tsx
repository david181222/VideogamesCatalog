export default function CatalogLoading() {
  return (
    <>
      <div className="mb-8">
        <div className="h-9 w-48 animate-pulse rounded bg-surface-elevated" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-surface-elevated" />
      </div>

      <div className="mb-8 flex flex-col gap-4">
        <div className="h-11 animate-pulse rounded bg-surface-elevated" />
        <div className="flex gap-3">
          <div className="h-10 w-36 animate-pulse rounded bg-surface-elevated" />
          <div className="h-10 w-36 animate-pulse rounded bg-surface-elevated" />
          <div className="h-10 w-36 animate-pulse rounded bg-surface-elevated" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded border border-border-custom bg-surface-elevated"
          >
            <div className="aspect-video w-full animate-pulse bg-surface" />
            <div className="flex flex-col gap-2 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 w-14 animate-pulse rounded bg-surface" />
                <div className="h-5 w-14 animate-pulse rounded bg-surface" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

'use client'

// Prev / Next pagination component. Preserves all existing URL params
// (filters, search) and only updates the `page` query param.
// Returns null if there is only one page — no need to render anything.
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number
  totalPages: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (totalPages <= 1) return null

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded border border-border-custom bg-surface-elevated px-4 py-2 font-mono text-sm uppercase tracking-wider text-text-secondary transition-colors hover:border-olive-dark hover:text-text-primary disabled:opacity-40 disabled:hover:border-border-custom disabled:hover:text-text-secondary"
      >
        Prev
      </button>

      <span className="font-mono text-sm text-text-secondary">
        <span className="text-accent">{currentPage}</span>
        {' / '}
        {totalPages}
      </span>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded border border-border-custom bg-surface-elevated px-4 py-2 font-mono text-sm uppercase tracking-wider text-text-secondary transition-colors hover:border-olive-dark hover:text-text-primary disabled:opacity-40 disabled:hover:border-border-custom disabled:hover:text-text-secondary"
      >
        Next
      </button>
    </div>
  )
}

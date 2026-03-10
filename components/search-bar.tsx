'use client'

// URL-driven search input. Updates the `q` query param on submit
// and resets the page counter to 1 to avoid empty result pages.
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  // Mirror the current `q` param as local state so the input is controlled
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }
    params.delete('page') // reset to page 1 on new search
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title..."
        className="flex-1 rounded border border-border-custom bg-surface px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-olive focus:outline-none"
      />
      <button
        type="submit"
        className="rounded border border-olive-dark bg-olive-dark px-5 py-2.5 font-mono text-sm uppercase tracking-wider text-text-primary transition-colors hover:bg-olive"
      >
        Search
      </button>
    </form>
  )
}

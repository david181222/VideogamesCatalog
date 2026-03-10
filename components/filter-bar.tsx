'use client'

// URL-driven filter dropdowns. Every change immediately updates the URL
// query params. The optional `showSort` prop enables the sort dropdown,
// used in the admin panel but hidden in the public catalog.
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { Genero, Plataforma } from '@/lib/types'

export function FilterBar({
  generos,
  plataformas,
  anios,
  showSort = false,
}: {
  generos: Genero[]
  plataformas: Plataforma[]
  anios: number[]
  showSort?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Set or remove a single param while preserving all others; reset page to 1
  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  const selectClasses =
    'rounded border border-border-custom bg-surface px-3 py-2 font-mono text-sm text-text-primary transition-colors focus:border-olive focus:outline-none'

  const hasFilters =
    searchParams.has('genero') ||
    searchParams.has('plataforma') ||
    searchParams.has('anio') ||
    searchParams.has('sort')

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get('genero') ?? ''}
        onChange={(e) => handleChange('genero', e.target.value)}
        className={selectClasses}
      >
        <option value="">All Genres</option>
        {generos.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nombre}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('plataforma') ?? ''}
        onChange={(e) => handleChange('plataforma', e.target.value)}
        className={selectClasses}
      >
        <option value="">All Platforms</option>
        {plataformas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('anio') ?? ''}
        onChange={(e) => handleChange('anio', e.target.value)}
        className={selectClasses}
      >
        <option value="">All Years</option>
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {/* Sort dropdown — only shown when showSort=true (admin panel) */}
      {showSort && (
        <select
          value={searchParams.get('sort') ?? ''}
          onChange={(e) => handleChange('sort', e.target.value)}
          className={selectClasses}
        >
          <option value="">Sort: A → Z</option>
          <option value="titulo_desc">Sort: Z → A</option>
          <option value="puntuacion_desc">Sort: Score ↓</option>
          <option value="puntuacion_asc">Sort: Score ↑</option>
          <option value="anio_desc">Sort: Newest</option>
          <option value="anio_asc">Sort: Oldest</option>
        </select>
      )}

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="rounded border border-border-custom px-3 py-2 font-mono text-xs uppercase tracking-wider text-text-muted transition-colors hover:border-danger hover:text-danger"
        >
          Clear
        </button>
      )}
    </div>
  )
}

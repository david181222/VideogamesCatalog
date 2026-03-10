import { createClient } from '@/lib/supabase/server'
import { fetchFilterOptions, fetchVideojuegos } from '@/lib/queries'
import { SearchBar } from '@/components/search-bar'
import { FilterBar } from '@/components/filter-bar'
import { VideogameCard } from '@/components/videogame-card'
import { Pagination } from '@/components/pagination'
import type { CatalogSearchParams, Videojuego } from '@/lib/types'

const PAGE_SIZE = 12

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ generos, plataformas, anios }, { videojuegos, count, totalPages, currentPage, error }] =
    await Promise.all([
      fetchFilterOptions(supabase),
      fetchVideojuegos(supabase, params, PAGE_SIZE),
    ])

  return (
    <>
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold uppercase tracking-widest text-text-primary">
          Videogames Catalog
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Browse the tactical library. {count} titles found.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4">
        <SearchBar />
        <FilterBar generos={generos} plataformas={plataformas} anios={anios} showSort />
      </div>

      {error && (
        <p className="mb-4 text-sm text-danger">
          Error loading catalog: {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videojuegos.map((v) => (
          <VideogameCard key={v.id} videojuego={v as Videojuego} />
        ))}
      </div>

      {videojuegos.length === 0 && !error && (
        <p className="py-16 text-center text-text-muted">
          No games found in mother base.
        </p>
      )}

      <div className="mt-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  )
}

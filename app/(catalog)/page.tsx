import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/search-bar'
import { FilterBar } from '@/components/filter-bar'
import { VideogameCard } from '@/components/videogame-card'
import { Pagination } from '@/components/pagination'
import type { CatalogSearchParams, Videojuego, Genero, Plataforma } from '@/lib/types'

const PAGE_SIZE = 12

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const currentPage = parseInt(params.page ?? '1')
  const offset = (currentPage - 1) * PAGE_SIZE

  // Fetch filter options in parallel
  const [generosRes, plataformasRes, aniosRes] = await Promise.all([
    supabase.from('generos').select('*').order('nombre'),
    supabase.from('plataformas').select('*').order('nombre'),
    supabase.from('videojuegos').select('anio').order('anio', { ascending: false }),
  ])

  const generos: Genero[] = generosRes.data ?? []
  const plataformas: Plataforma[] = plataformasRes.data ?? []
  const anios: number[] = [...new Set((aniosRes.data ?? []).map((v) => v.anio))]

  // Build an array of IDs to filter by (two-query approach for junction tables)
  let filterIds: number[] | null = null

  if (params.genero) {
    const { data: vgIds } = await supabase
      .from('videojuegos_generos')
      .select('videojuego_id')
      .eq('genero_id', parseInt(params.genero))
    const ids = (vgIds ?? []).map((r) => r.videojuego_id)
    filterIds = ids.length > 0 ? ids : [-1]
  }

  if (params.plataforma) {
    const { data: vpIds } = await supabase
      .from('videojuegos_plataformas')
      .select('videojuego_id')
      .eq('plataforma_id', parseInt(params.plataforma))
    const platIds = (vpIds ?? []).map((r) => r.videojuego_id)

    if (filterIds) {
      // Intersection with existing filter IDs (AND logic)
      const platSet = new Set(platIds)
      filterIds = filterIds.filter((id) => platSet.has(id))
      if (filterIds.length === 0) filterIds = [-1]
    } else {
      filterIds = platIds.length > 0 ? platIds : [-1]
    }
  }

  // Main query
  let query = supabase
    .from('videojuegos')
    .select(
      `
      *,
      desarrolladores(id, nombre),
      videojuegos_generos(generos(id, nombre)),
      videojuegos_plataformas(plataformas(id, nombre))
    `,
      { count: 'exact' }
    )

  // Apply search
  if (params.q) {
    query = query.ilike('titulo', `%${params.q}%`)
  }

  // Apply junction table filters
  if (filterIds) {
    query = query.in('id', filterIds)
  }

  // Apply year filter
  if (params.anio) {
    query = query.eq('anio', parseInt(params.anio))
  }

  // Pagination
  query = query.order('titulo').range(offset, offset + PAGE_SIZE - 1)

  const { data: videojuegos, count, error } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold uppercase tracking-widest text-text-primary">
          Videogames Catalog
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Browse the tactical library. {count ?? 0} titles found.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4">
        <SearchBar />
        <FilterBar generos={generos} plataformas={plataformas} anios={anios} />
      </div>

      {error && (
        <p className="mb-4 text-sm text-danger">
          Error loading catalog: {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(videojuegos ?? []).map((v) => (
          <VideogameCard key={v.id} videojuego={v as Videojuego} />
        ))}
      </div>

      {videojuegos?.length === 0 && !error && (
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

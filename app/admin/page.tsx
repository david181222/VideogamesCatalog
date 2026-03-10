import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DeleteButton } from '@/components/delete-button'
import { SearchBar } from '@/components/search-bar'
import { FilterBar } from '@/components/filter-bar'
import { Pagination } from '@/components/pagination'
import type { Videojuego, Genero, Plataforma, CatalogSearchParams } from '@/lib/types'

const PAGE_SIZE = 20

export default async function AdminPage({
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

  // Two-query approach for junction table filters
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

  if (params.q) {
    query = query.ilike('titulo', `%${params.q}%`)
  }

  if (filterIds) {
    query = query.in('id', filterIds)
  }

  if (params.anio) {
    query = query.eq('anio', parseInt(params.anio))
  }

  // Sorting
  const sort = params.sort ?? ''
  switch (sort) {
    case 'titulo_desc':
      query = query.order('titulo', { ascending: false })
      break
    case 'puntuacion_desc':
      query = query.order('puntuacion', { ascending: false, nullsFirst: false })
      break
    case 'puntuacion_asc':
      query = query.order('puntuacion', { ascending: true, nullsFirst: false })
      break
    case 'anio_desc':
      query = query.order('anio', { ascending: false })
      break
    case 'anio_asc':
      query = query.order('anio', { ascending: true })
      break
    default:
      query = query.order('titulo')
  }

  // Pagination
  query = query.range(offset, offset + PAGE_SIZE - 1)

  const { data, count, error } = await query
  const videojuegos = (data ?? []) as Videojuego[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold uppercase tracking-widest text-text-primary">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage the videogame catalog. {count ?? 0} titles found.
          </p>
        </div>
        <Link
          href="/admin/create"
          className="rounded border border-olive-dark bg-olive-dark px-5 py-2.5 font-mono text-sm uppercase tracking-wider text-text-primary transition-colors hover:bg-olive"
        >
          + New Game
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <SearchBar />
        <FilterBar generos={generos} plataformas={plataformas} anios={anios} showSort />
      </div>

      {error && (
        <p className="mb-4 text-sm text-danger">
          Error loading data: {error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded border border-border-custom">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-custom bg-surface">
            <tr>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                Title
              </th>
              <th className="hidden px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted sm:table-cell">
                Year
              </th>
              <th className="hidden px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted md:table-cell">
                Developer
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                Score
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-custom">
            {videojuegos.map((v) => (
              <tr
                key={v.id}
                className="bg-surface-elevated transition-colors hover:bg-surface"
              >
                <td className="px-4 py-3 font-medium text-text-primary">
                  {v.titulo}
                </td>
                <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">
                  {v.anio}
                </td>
                <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
                  {v.desarrolladores?.nombre ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {v.puntuacion !== null ? (
                    <span
                      className={`font-mono font-bold ${
                        v.puntuacion >= 75
                          ? 'text-accent'
                          : v.puntuacion >= 50
                            ? 'text-warning'
                            : 'text-danger'
                      }`}
                    >
                      {v.puntuacion}
                    </span>
                  ) : (
                    <span className="text-text-muted">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/edit/${v.id}`}
                      className="rounded border border-border-custom px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-muted transition-colors hover:border-olive-dark hover:text-olive-light"
                    >
                      Edit
                    </Link>
                    <DeleteButton videojuegoId={v.id} titulo={v.titulo} />
                  </div>
                </td>
              </tr>
            ))}
            {videojuegos.length === 0 && !error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-text-muted"
                >
                  No games found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  )
}

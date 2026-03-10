import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogSearchParams, Genero, Plataforma, Videojuego } from '@/lib/types'

// ─── Fetch filter dropdown options ──────────────────────────────

export async function fetchFilterOptions(supabase: SupabaseClient) {
  const [generosRes, plataformasRes, aniosRes] = await Promise.all([
    supabase.from('generos').select('*').order('nombre'),
    supabase.from('plataformas').select('*').order('nombre'),
    supabase.from('videojuegos').select('anio').order('anio', { ascending: false }),
  ])

  const generos: Genero[] = generosRes.data ?? []
  const plataformas: Plataforma[] = plataformasRes.data ?? []
  const anios: number[] = [...new Set((aniosRes.data ?? []).map((v) => v.anio))]

  return { generos, plataformas, anios }
}

// ─── Junction table filter (two-query approach) ─────────────────

export async function fetchFilterIds(
  supabase: SupabaseClient,
  params: CatalogSearchParams
): Promise<number[] | null> {
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

  return filterIds
}

// ─── Full videogame query with filters, sort & pagination ───────

export async function fetchVideojuegos(
  supabase: SupabaseClient,
  params: CatalogSearchParams,
  pageSize: number
) {
  const currentPage = parseInt(params.page ?? '1')
  const offset = (currentPage - 1) * pageSize

  const filterIds = await fetchFilterIds(supabase, params)

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

  // Sort
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
      query = query.order('titulo') // A → Z
  }

  query = query.range(offset, offset + pageSize - 1)

  const { data, count, error } = await query

  return {
    videojuegos: (data ?? []) as Videojuego[],
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
    currentPage,
    error,
  }
}

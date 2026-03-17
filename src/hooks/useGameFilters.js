import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Hook reutilizable: encapsula estado de filtros + query a videojuegos.
// Lo consumen tanto Catalog como AdminDashboard.
// paginate: true activa paginación server-side (Catalog), false trae todos los registros (AdminDashboard).
// pageSize: cantidad de juegos por página cuando paginate es true (por defecto 12).
export function useGameFilters({ paginate = true, pageSize = 12 } = {}) {
  const [games, setGames] = useState([])
  const [generos, setGeneros] = useState([])
  const [plataformas, setPlataformas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)

  const [search, setSearch] = useState('')
  const [generoId, setGeneroId] = useState('')
  const [plataformaId, setPlataformaId] = useState('')
  const [anio, setAnio] = useState('')
  const [puntuacionMin, setPuntuacionMin] = useState('')
  const [order, setOrder] = useState('titulo_asc')

  // Setters envueltos: al cambiar cualquier filtro se resetea la página en el mismo ciclo de render (React 19 lo batchea)
  const changeSearch = (v) => { setSearch(v); setPage(0) }
  const changeGeneroId = (v) => { setGeneroId(v); setPage(0) }
  const changePlataformaId = (v) => { setPlataformaId(v); setPage(0) }
  const changeAnio = (v) => { setAnio(v); setPage(0) }
  const changePuntuacionMin = (v) => { setPuntuacionMin(v); setPage(0) }
  const changeOrder = (v) => { setOrder(v); setPage(0) }

  useEffect(() => {
    async function loadFilterOptions() {
      const [generosRes, plataformasRes] = await Promise.all([
        supabase.from('generos').select('*').order('nombre'),
        supabase.from('plataformas').select('*').order('nombre'),
      ])
      if (!generosRes.error) setGeneros(generosRes.data)
      if (!plataformasRes.error) setPlataformas(plataformasRes.data)
    }
    loadFilterOptions()
  }, [])

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('videojuegos')
      .select(`
        *,
        desarrolladores(id, nombre),
        videojuegos_generos(generos(id, nombre)),
        videojuegos_plataformas(plataformas(id, nombre))
      `, paginate ? { count: 'exact' } : undefined)

    if (search) query = query.ilike('titulo', `%${search}%`)
    if (anio) query = query.eq('anio', Number(anio))
    if (puntuacionMin) query = query.gte('puntuacion', Number(puntuacionMin))

    if (generoId) {
      const { data: ids, error: err } = await supabase
        .from('videojuegos_generos')
        .select('videojuego_id')
        .eq('genero_id', generoId)
      if (err) { setError(err.message); setLoading(false); return }
      const gameIds = ids.map((r) => r.videojuego_id)
      if (gameIds.length === 0) { setGames([]); setTotalCount(0); setLoading(false); return }
      query = query.in('id', gameIds)
    }

    if (plataformaId) {
      const { data: ids, error: err } = await supabase
        .from('videojuegos_plataformas')
        .select('videojuego_id')
        .eq('plataforma_id', plataformaId)
      if (err) { setError(err.message); setLoading(false); return }
      const gameIds = ids.map((r) => r.videojuego_id)
      if (gameIds.length === 0) { setGames([]); setTotalCount(0); setLoading(false); return }
      query = query.in('id', gameIds)
    }

    const orderMap = {
      titulo_asc:      { column: 'titulo',     ascending: true  },
      titulo_desc:     { column: 'titulo',     ascending: false },
      puntuacion_desc: { column: 'puntuacion', ascending: false },
      puntuacion_asc:  { column: 'puntuacion', ascending: true  },
      anio_desc:       { column: 'anio',       ascending: false },
      anio_asc:        { column: 'anio',       ascending: true  },
    }
    const { column, ascending } = orderMap[order] || orderMap.titulo_asc
    query = query.order(column, { ascending })

    if (paginate) {
      const from = page * pageSize
      const to = (page + 1) * pageSize - 1
      query = query.range(from, to)
    }

    const { data, error: fetchError, count } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setGames(data)
      if (paginate) setTotalCount(count ?? 0)
    }
    setLoading(false)
  }, [search, generoId, plataformaId, anio, puntuacionMin, order, page, paginate])

  useEffect(() => {
    const timer = setTimeout(fetchGames, 300)
    return () => clearTimeout(timer)
  }, [fetchGames])

  // filterProps agrupa todo lo que necesita <GameFilters />
  const filterProps = {
    search,    setSearch: changeSearch,
    generoId,  setGeneroId: changeGeneroId,
    plataformaId, setPlataformaId: changePlataformaId,
    anio,      setAnio: changeAnio,
    puntuacionMin, setPuntuacionMin: changePuntuacionMin,
    order,     setOrder: changeOrder,
    generos,
    plataformas,
  }

  return { games, loading, error, filterProps, refetch: fetchGames, page, setPage, totalCount, pageSize }
}

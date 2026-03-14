import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import InlineAddField from '../../components/InlineAddField'
import Input from '../../components/Input'
import Button from '../../components/Button'
import ErrorMessage from '../../components/ErrorMessage'

const selectClass =
  'w-full bg-surface border border-border-custom text-text-primary rounded px-3 py-2 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent'

const labelClass = 'block text-sm font-medium text-text-secondary mb-1'

export default function GameForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [titulo, setTitulo] = useState('')
  const [anio, setAnio] = useState('')
  const [puntuacion, setPuntuacion] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [desarrolladorId, setDesarrolladorId] = useState('')
  const [selectedGeneros, setSelectedGeneros] = useState([])
  const [selectedPlataformas, setSelectedPlataformas] = useState([])

  const [desarrolladores, setDesarrolladores] = useState([])
  const [generos, setGeneros] = useState([])
  const [plataformas, setPlataformas] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadOptions() {
      const [devRes, genRes, platRes] = await Promise.all([
        supabase.from('desarrolladores').select('*').order('nombre'),
        supabase.from('generos').select('*').order('nombre'),
        supabase.from('plataformas').select('*').order('nombre'),
      ])
      if (!devRes.error) setDesarrolladores(devRes.data)
      if (!genRes.error) setGeneros(genRes.data)
      if (!platRes.error) setPlataformas(platRes.data)
    }
    loadOptions()
  }, [])

  useEffect(() => {
    if (!isEditing) return
    async function loadGame() {
      const { data, error } = await supabase
        .from('videojuegos')
        .select(`*, videojuegos_generos(genero_id), videojuegos_plataformas(plataforma_id)`)
        .eq('id', id)
        .single()

      if (error) { setError(error.message); return }

      setTitulo(data.titulo)
      setAnio(String(data.anio))
      setPuntuacion(data.puntuacion !== null ? String(data.puntuacion) : '')
      setImagenUrl(data.imagen_url || '')
      setDesarrolladorId(data.desarrollador_id ? String(data.desarrollador_id) : '')
      setSelectedGeneros(data.videojuegos_generos.map((vg) => vg.genero_id))
      setSelectedPlataformas(data.videojuegos_plataformas.map((vp) => vp.plataforma_id))
    }
    loadGame()
  }, [id, isEditing])

  function handleGeneroToggle(generoId) {
    setSelectedGeneros((prev) =>
      prev.includes(generoId) ? prev.filter((g) => g !== generoId) : [...prev, generoId]
    )
  }

  function handlePlataformaToggle(plataformaId) {
    setSelectedPlataformas((prev) =>
      prev.includes(plataformaId) ? prev.filter((p) => p !== plataformaId) : [...prev, plataformaId]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const gameData = {
      titulo,
      anio: Number(anio),
      puntuacion: puntuacion ? Number(puntuacion) : null,
      imagen_url: imagenUrl || null,
      desarrollador_id: desarrolladorId ? Number(desarrolladorId) : null,
    }

    let gameId = id

    if (isEditing) {
      const { error } = await supabase.from('videojuegos').update(gameData).eq('id', id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('videojuegos').insert(gameData).select().single()
      if (error) { setError(error.message); setLoading(false); return }
      gameId = data.id
    }

    // Actualizar relaciones N:M: delete + insert
    const { error: delGenErr } = await supabase
      .from('videojuegos_generos').delete().eq('videojuego_id', gameId)
    if (delGenErr) { setError(delGenErr.message); setLoading(false); return }

    const { error: delPlatErr } = await supabase
      .from('videojuegos_plataformas').delete().eq('videojuego_id', gameId)
    if (delPlatErr) { setError(delPlatErr.message); setLoading(false); return }

    if (selectedGeneros.length > 0) {
      const genRows = selectedGeneros.map((genero_id) => ({ videojuego_id: Number(gameId), genero_id }))
      const { error } = await supabase.from('videojuegos_generos').insert(genRows)
      if (error) { setError(error.message); setLoading(false); return }
    }

    if (selectedPlataformas.length > 0) {
      const platRows = selectedPlataformas.map((plataforma_id) => ({ videojuego_id: Number(gameId), plataforma_id }))
      const { error } = await supabase.from('videojuegos_plataformas').insert(platRows)
      if (error) { setError(error.message); setLoading(false); return }
    }

    navigate('/admin')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6 tracking-wide">
        {isEditing ? 'Editar Videojuego' : 'Nuevo Videojuego'}
      </h1>

      <ErrorMessage error={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Título"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Año"
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            required
          />
          <Input
            label="Puntuación (0–100)"
            type="number"
            value={puntuacion}
            onChange={(e) => setPuntuacion(e.target.value)}
            min={0}
            max={100}
          />
        </div>

        <Input
          label="URL de Imagen"
          type="url"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
        />

        <div>
          <label className={labelClass}>Desarrollador</label>
          <select
            value={desarrolladorId}
            onChange={(e) => setDesarrolladorId(e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccionar...</option>
            {desarrolladores.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
          <InlineAddField
            tabla="desarrolladores"
            onAdded={(newDev) => {
              setDesarrolladores((prev) => [...prev, newDev])
              setDesarrolladorId(String(newDev.id))
            }}
          />
        </div>

        <div>
          <label className={labelClass}>Géneros</label>
          <div className="flex flex-wrap gap-2 p-3 bg-surface border border-border-custom rounded max-h-40 overflow-y-auto">
            {generos.map((g) => (
              <label key={g.id} className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={selectedGeneros.includes(g.id)}
                  onChange={() => handleGeneroToggle(g.id)}
                  className="accent-accent"
                />
                {g.nombre}
              </label>
            ))}
          </div>
          <InlineAddField
            tabla="generos"
            onAdded={(newGen) => setGeneros((prev) => [...prev, newGen])}
          />
        </div>

        <div>
          <label className={labelClass}>Plataformas</label>
          <div className="flex flex-wrap gap-2 p-3 bg-surface border border-border-custom rounded max-h-40 overflow-y-auto">
            {plataformas.map((p) => (
              <label key={p.id} className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={selectedPlataformas.includes(p.id)}
                  onChange={() => handlePlataformaToggle(p.id)}
                  className="accent-accent"
                />
                {p.nombre}
              </label>
            ))}
          </div>
          <InlineAddField
            tabla="plataformas"
            onAdded={(newPlat) => setPlataformas((prev) => [...prev, newPlat])}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="px-6">
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin')}
            className="px-6"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

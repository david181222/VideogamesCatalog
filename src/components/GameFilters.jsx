export default function GameFilters({
  search, setSearch,
  generoId, setGeneroId,
  plataformaId, setPlataformaId,
  anio, setAnio,
  puntuacionMin, setPuntuacionMin,
  order, setOrder,
  generos,
  plataformas,
}) {
  const inputClass =
    'bg-surface border border-border-custom text-text-primary rounded px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent w-full'

  return (
    <div className="surface-card rounded-lg p-4 mb-6 space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por título..."
        className={inputClass}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <select
          value={generoId}
          onChange={(e) => setGeneroId(e.target.value)}
          className={inputClass}
        >
          <option value="">Todos los géneros</option>
          {generos.map((g) => (
            <option key={g.id} value={g.id}>{g.nombre}</option>
          ))}
        </select>

        <select
          value={plataformaId}
          onChange={(e) => setPlataformaId(e.target.value)}
          className={inputClass}
        >
          <option value="">Todas las plataformas</option>
          {plataformas.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        <input
          type="number"
          value={anio}
          onChange={(e) => setAnio(e.target.value)}
          placeholder="Año exacto"
          className={inputClass}
        />

        <input
          type="number"
          value={puntuacionMin}
          onChange={(e) => setPuntuacionMin(e.target.value)}
          placeholder="Punt. mínima"
          min={0}
          max={100}
          className={inputClass}
        />

        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className={inputClass}
        >
          <option value="titulo_asc">Título A-Z</option>
          <option value="titulo_desc">Título Z-A</option>
          <option value="puntuacion_desc">Mejor puntuación</option>
          <option value="puntuacion_asc">Peor puntuación</option>
          <option value="anio_desc">Más reciente</option>
          <option value="anio_asc">Más antiguo</option>
        </select>
      </div>
    </div>
  )
}

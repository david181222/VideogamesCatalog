export default function GameCard({ game }) {
  const {
    titulo, anio, puntuacion, imagen_url,
    desarrolladores, videojuegos_generos, videojuegos_plataformas,
  } = game

  const generos = videojuegos_generos?.map((vg) => vg.generos?.nombre).filter(Boolean)
  const plataformas = videojuegos_plataformas?.map((vp) => vp.plataformas?.nombre).filter(Boolean)

  return (
    <div className="surface-card rounded-lg overflow-hidden flex flex-col hover:border-olive transition-colors">
      <img
        src={imagen_url?.trim() ? imagen_url : '/assets/cj.webp'}
        alt={titulo}
        className="w-full h-48 object-cover"
        onError={(e) => {
          e.target.onerror = null       // evita loop infinito
          e.target.src = '/assets/cj.webp'  // cae a CJ si la URL falla
        }}
      />
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-text-primary mb-1 leading-snug">{titulo}</h3>

        <p className="text-sm text-text-secondary mb-2">
          {desarrolladores?.nombre || 'Sin desarrollador'} &middot; {anio}
        </p>

        {puntuacion !== null && puntuacion !== undefined && (
          <span className="inline-block w-fit text-xs font-bold px-2 py-0.5 rounded bg-olive-darkest text-accent score-glow mb-3">
            {puntuacion}/100
          </span>
        )}

        <div className="mt-auto space-y-1.5">
          {generos?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {generos.map((g) => (
                <span key={g} className="text-xs bg-olive-darkest text-olive-mist px-2 py-0.5 rounded border border-border-custom">
                  {g}
                </span>
              ))}
            </div>
          )}
          {plataformas?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {plataformas.map((p) => (
                <span key={p} className="text-xs bg-surface text-khaki px-2 py-0.5 rounded border border-border-custom">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

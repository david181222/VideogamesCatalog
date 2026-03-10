// Card component for a single videogame in the catalog grid.
// Server Component — receives the full Videojuego object from the parent page.
import Image from 'next/image'
import type { Videojuego } from '@/lib/types'

// Score color thresholds: ≥75 green glow, ≥50 amber, <50 red
function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-sm text-text-muted">N/A</span>
  }

  let colorClass = 'text-danger'
  if (score >= 75) {
    colorClass = 'text-accent score-glow'
  } else if (score >= 50) {
    colorClass = 'text-warning'
  }

  return (
    <span className={`font-mono text-lg font-bold ${colorClass}`}>
      {score}
    </span>
  )
}

export function VideogameCard({
  videojuego,
}: {
  videojuego: Videojuego
}) {
  // Unwrap nested junction table arrays into flat lists
  const generos =
    videojuego.videojuegos_generos?.map((vg) => vg.generos) ?? []
  const plataformas =
    videojuego.videojuegos_plataformas?.map((vp) => vp.plataformas) ?? []

  return (
    <div className="group flex flex-col overflow-hidden rounded border border-border-custom bg-surface-elevated transition-colors hover:border-olive-dark">
      {/* Cover image — aspect-video keeps card heights consistent */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface">
        {videojuego.imagen_url ? (
          <Image
            src={videojuego.imagen_url}
            alt={videojuego.titulo}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-sm uppercase text-text-muted">
              No Image
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-text-primary">
            {videojuego.titulo}
          </h3>
          <ScoreDisplay score={videojuego.puntuacion} />
        </div>

        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>{videojuego.anio}</span>
          {videojuego.desarrolladores && (
            <>
              <span className="text-text-muted">|</span>
              <span>{videojuego.desarrolladores.nombre}</span>
            </>
          )}
        </div>

        {/* Genre pills (olive accent) */}
        {generos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {generos.map((g) => (
              <span
                key={g.id}
                className="rounded-sm border border-olive-dark/50 bg-olive-darkest/50 px-1.5 py-0.5 text-xs text-olive-light"
              >
                {g.nombre}
              </span>
            ))}
          </div>
        )}

        {/* Platform pills (neutral) */}
        {plataformas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {plataformas.map((p) => (
              <span
                key={p.id}
                className="rounded-sm border border-border-custom bg-surface px-1.5 py-0.5 text-xs text-text-muted"
              >
                {p.nombre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

// Shared create/edit form for videogames. Used in both /admin/create and
// /admin/edit/[id]. Accepts a Server Action via the `action` prop and uses
// React 19's useActionState (replaces the deprecated useFormState).
import { useActionState, useState } from 'react'
import type { Desarrollador, Genero, Plataforma, Videojuego } from '@/lib/types'

type FormState = {
  error: string | null
}

export function VideogameForm({
  desarrolladores,
  generos,
  plataformas,
  defaultValues,
  action,
}: {
  desarrolladores: Desarrollador[]
  generos: Genero[]
  plataformas: Plataforma[]
  defaultValues?: Videojuego       // when provided, the form operates in edit mode
  action: (prevState: FormState, formData: FormData) => Promise<FormState>
}) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  // Developer field mode: 'select' shows existing developers, 'new' shows a text input
  const [devMode, setDevMode] = useState<'select' | 'new'>('select')

  // Pre-select genres and platforms when editing an existing game
  const selectedGeneros = new Set(
    defaultValues?.videojuegos_generos?.map((vg) => vg.generos.id) ?? []
  )
  const selectedPlataformas = new Set(
    defaultValues?.videojuegos_plataformas?.map((vp) => vp.plataformas.id) ?? []
  )

  const inputClasses =
    'w-full rounded border border-border-custom bg-surface px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-olive focus:outline-none'
  const labelClasses = 'block font-mono text-xs uppercase tracking-wider text-text-secondary mb-1.5'

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-6">
      {/* Hidden id field — only present in edit mode */}
      {defaultValues && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      {state.error && (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="titulo" className={labelClasses}>
          Title *
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          defaultValue={defaultValues?.titulo ?? ''}
          className={inputClasses}
          placeholder="Game title"
        />
      </div>

      {/* Year + Score row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="anio" className={labelClasses}>
            Year *
          </label>
          <input
            id="anio"
            name="anio"
            type="number"
            required
            min={1950}
            max={2100}
            defaultValue={defaultValues?.anio ?? ''}
            className={inputClasses}
            placeholder="2024"
          />
        </div>
        <div>
          <label htmlFor="puntuacion" className={labelClasses}>
            Score (0-100)
          </label>
          <input
            id="puntuacion"
            name="puntuacion"
            type="number"
            min={0}
            max={100}
            defaultValue={defaultValues?.puntuacion ?? ''}
            className={inputClasses}
            placeholder="85"
          />
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="imagen_url" className={labelClasses}>
          Image URL
        </label>
        <input
          id="imagen_url"
          name="imagen_url"
          type="url"
          defaultValue={defaultValues?.imagen_url ?? ''}
          className={inputClasses}
          placeholder="https://example.com/cover.jpg"
        />
      </div>

      {/* Developer — toggle between selecting existing and creating new */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={labelClasses.replace(' mb-1.5', '')}>Developer</span>
          <button
            type="button"
            onClick={() => setDevMode(devMode === 'select' ? 'new' : 'select')}
            className="font-mono text-xs uppercase tracking-wider text-olive-light transition-colors hover:text-accent"
          >
            {devMode === 'select' ? '+ New Developer' : 'Select Existing'}
          </button>
        </div>
        {devMode === 'select' ? (
          // Posts desarrollador_id; the action uses its integer value
          <select
            id="desarrollador_id"
            name="desarrollador_id"
            defaultValue={defaultValues?.desarrollador_id ?? ''}
            className={inputClasses}
          >
            <option value="">-- Select --</option>
            {desarrolladores.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        ) : (
          // Posts new_desarrollador; the action creates it and uses its new ID
          <input
            id="new_desarrollador"
            name="new_desarrollador"
            type="text"
            className={inputClasses}
            placeholder="Type new developer name..."
          />
        )}
      </div>

      {/* Genres multi-checkbox */}
      <div>
        <span className={labelClasses}>Genres</span>
        <div className="mt-2 flex flex-wrap gap-3">
          {generos.map((g) => (
            <label
              key={g.id}
              className="flex items-center gap-2 rounded border border-border-custom bg-surface px-3 py-2 text-sm text-text-secondary transition-colors has-[:checked]:border-olive-dark has-[:checked]:text-olive-light"
            >
              <input
                type="checkbox"
                name="generos"
                value={g.id}
                defaultChecked={selectedGeneros.has(g.id)}
                className="accent-olive"
              />
              {g.nombre}
            </label>
          ))}
        </div>
      </div>

      {/* Platforms multi-checkbox */}
      <div>
        <span className={labelClasses}>Platforms</span>
        <div className="mt-2 flex flex-wrap gap-3">
          {plataformas.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 rounded border border-border-custom bg-surface px-3 py-2 text-sm text-text-secondary transition-colors has-[:checked]:border-olive-dark has-[:checked]:text-olive-light"
            >
              <input
                type="checkbox"
                name="plataformas"
                value={p.id}
                defaultChecked={selectedPlataformas.has(p.id)}
                className="accent-olive"
              />
              {p.nombre}
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded border border-olive-dark bg-olive-dark px-6 py-3 font-mono text-sm uppercase tracking-widest text-text-primary transition-colors hover:bg-olive disabled:opacity-50"
      >
        {pending
          ? 'Processing...'
          : defaultValues
            ? 'Update Videogame'
            : 'Create Videogame'}
      </button>
    </form>
  )
}

// ─── Shared TypeScript types used across the entire application ──────────────

export type Profile = {
  id: string
  role: 'user' | 'admin' // role is stored in public.profiles, never in JWT claims
}

export type Desarrollador = {
  id: number
  nombre: string
}

export type Genero = {
  id: number
  nombre: string
}

export type Plataforma = {
  id: number
  nombre: string
}

// Videojuego includes optional nested relations from Supabase joins
export type Videojuego = {
  id: number
  titulo: string
  anio: number
  puntuacion: number | null
  imagen_url: string | null
  desarrollador_id: number | null
  // Populated when using .select('*, desarrolladores(...)')
  desarrolladores?: Desarrollador
  // Junction table relations (N:M)
  videojuegos_generos?: { generos: Genero }[]
  videojuegos_plataformas?: { plataformas: Plataforma }[]
}

// URL search params for catalog and admin pages
export type CatalogSearchParams = {
  q?: string          // title search (ilike)
  genero?: string     // genre id
  plataforma?: string // platform id
  anio?: string       // release year
  sort?: string       // sort key: titulo_desc | puntuacion_desc | puntuacion_asc | anio_desc | anio_asc
  page?: string       // current page (1-indexed)
}

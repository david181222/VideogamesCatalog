'use server'

// All Server Actions are defined here. They run exclusively on the server,
// have direct database access, and are called from Client Component forms.
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Auth Actions ────────────────────────────────────────────────

type AuthState = { error: string | null }

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Helper: verify admin ────────────────────────────────────────

// Called at the top of every CRUD action. Returns early with an error string
// if the user is unauthenticated or does not have the 'admin' role.
async function verifyAdmin(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { supabase, error: 'Unauthorized: admin role required' }
  }

  return { supabase, error: null }
}

// ─── CRUD Actions ────────────────────────────────────────────────

type FormState = { error: string | null }

export async function createVideojuego(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, error: authError } = await verifyAdmin()
  if (authError) return { error: authError }

  const titulo = formData.get('titulo') as string
  const anio = parseInt(formData.get('anio') as string)
  const puntuacionRaw = formData.get('puntuacion') as string
  const puntuacion = puntuacionRaw ? parseInt(puntuacionRaw) : null
  const imagen_url = (formData.get('imagen_url') as string) || null
  const desarrolladorRaw = formData.get('desarrollador_id') as string
  // new_desarrollador is set when the user types a new developer name in the form
  const newDesarrollador = (formData.get('new_desarrollador') as string)?.trim() || null
  const generoIds = formData.getAll('generos').map(Number)
  const plataformaIds = formData.getAll('plataformas').map(Number)

  if (!titulo.trim()) {
    return { error: 'Title is required' }
  }
  if (puntuacion !== null && (puntuacion < 0 || puntuacion > 100)) {
    return { error: 'Score must be between 0 and 100' }
  }

  // If a new developer name was typed, insert it first and use its ID
  let desarrollador_id: number | null = null
  if (newDesarrollador) {
    const { data: newDev, error: devError } = await supabase
      .from('desarrolladores')
      .insert({ nombre: newDesarrollador })
      .select('id')
      .single()
    if (devError) return { error: `Error creating developer: ${devError.message}` }
    desarrollador_id = newDev.id
  } else if (desarrolladorRaw) {
    desarrollador_id = parseInt(desarrolladorRaw)
  }

  // Insert the game record
  const { data: videojuego, error } = await supabase
    .from('videojuegos')
    .insert({ titulo: titulo.trim(), anio, puntuacion, imagen_url, desarrollador_id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Insert N:M genre relations
  if (generoIds.length > 0) {
    const { error: genError } = await supabase
      .from('videojuegos_generos')
      .insert(generoIds.map((genero_id) => ({ videojuego_id: videojuego.id, genero_id })))

    if (genError) return { error: genError.message }
  }

  // Insert N:M platform relations
  if (plataformaIds.length > 0) {
    const { error: platError } = await supabase
      .from('videojuegos_plataformas')
      .insert(
        plataformaIds.map((plataforma_id) => ({
          videojuego_id: videojuego.id,
          plataforma_id,
        }))
      )

    if (platError) return { error: platError.message }
  }

  revalidatePath('/')
  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateVideojuego(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, error: authError } = await verifyAdmin()
  if (authError) return { error: authError }

  const id = parseInt(formData.get('id') as string)
  const titulo = formData.get('titulo') as string
  const anio = parseInt(formData.get('anio') as string)
  const puntuacionRaw = formData.get('puntuacion') as string
  const puntuacion = puntuacionRaw ? parseInt(puntuacionRaw) : null
  const imagen_url = (formData.get('imagen_url') as string) || null
  const desarrolladorRaw = formData.get('desarrollador_id') as string
  const newDesarrollador = (formData.get('new_desarrollador') as string)?.trim() || null
  const generoIds = formData.getAll('generos').map(Number)
  const plataformaIds = formData.getAll('plataformas').map(Number)

  if (!titulo.trim()) {
    return { error: 'Title is required' }
  }
  if (puntuacion !== null && (puntuacion < 0 || puntuacion > 100)) {
    return { error: 'Score must be between 0 and 100' }
  }

  // Resolve developer (same logic as create)
  let desarrollador_id: number | null = null
  if (newDesarrollador) {
    const { data: newDev, error: devError } = await supabase
      .from('desarrolladores')
      .insert({ nombre: newDesarrollador })
      .select('id')
      .single()
    if (devError) return { error: `Error creating developer: ${devError.message}` }
    desarrollador_id = newDev.id
  } else if (desarrolladorRaw) {
    desarrollador_id = parseInt(desarrolladorRaw)
  }

  const { error } = await supabase
    .from('videojuegos')
    .update({ titulo: titulo.trim(), anio, puntuacion, imagen_url, desarrollador_id })
    .eq('id', id)

  if (error) return { error: error.message }

  // Replace junction relations: delete all existing rows, then insert new ones
  const { error: delGenError } = await supabase
    .from('videojuegos_generos')
    .delete()
    .eq('videojuego_id', id)

  if (delGenError) return { error: delGenError.message }

  if (generoIds.length > 0) {
    const { error: genError } = await supabase
      .from('videojuegos_generos')
      .insert(generoIds.map((genero_id) => ({ videojuego_id: id, genero_id })))

    if (genError) return { error: genError.message }
  }

  const { error: delPlatError } = await supabase
    .from('videojuegos_plataformas')
    .delete()
    .eq('videojuego_id', id)

  if (delPlatError) return { error: delPlatError.message }

  if (plataformaIds.length > 0) {
    const { error: platError } = await supabase
      .from('videojuegos_plataformas')
      .insert(
        plataformaIds.map((plataforma_id) => ({
          videojuego_id: id,
          plataforma_id,
        }))
      )

    if (platError) return { error: platError.message }
  }

  revalidatePath('/')
  revalidatePath('/admin')
  redirect('/admin')
}

export async function deleteVideojuego(formData: FormData) {
  const { supabase, error: authError } = await verifyAdmin()
  if (authError) return { error: authError }

  const id = parseInt(formData.get('id') as string)

  // Delete FK-constrained rows first to avoid foreign key violations
  const { error: delGenError } = await supabase
    .from('videojuegos_generos')
    .delete()
    .eq('videojuego_id', id)

  if (delGenError) return { error: delGenError.message }

  const { error: delPlatError } = await supabase
    .from('videojuegos_plataformas')
    .delete()
    .eq('videojuego_id', id)

  if (delPlatError) return { error: delPlatError.message }

  const { error } = await supabase.from('videojuegos').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/admin')
  redirect('/admin')
}

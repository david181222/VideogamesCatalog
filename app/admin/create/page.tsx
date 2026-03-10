import { createClient } from '@/lib/supabase/server'
import { VideogameForm } from '@/components/videogame-form'
import { createVideojuego } from '@/app/actions'

export default async function CreatePage() {
  const supabase = await createClient()

  const [devRes, genRes, platRes] = await Promise.all([
    supabase.from('desarrolladores').select('*').order('nombre'),
    supabase.from('generos').select('*').order('nombre'),
    supabase.from('plataformas').select('*').order('nombre'),
  ])

  return (
    <>
      <h1 className="mb-8 font-mono text-2xl font-bold uppercase tracking-widest text-text-primary">
        Create Videogame
      </h1>
      <VideogameForm
        desarrolladores={devRes.data ?? []}
        generos={genRes.data ?? []}
        plataformas={platRes.data ?? []}
        action={createVideojuego}
      />
    </>
  )
}

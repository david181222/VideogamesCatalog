import { createClient } from '@/lib/supabase/server'
import { VideogameForm } from '@/components/videogame-form'
import { updateVideojuego } from '@/app/actions'
import { notFound } from 'next/navigation'
import type { Videojuego } from '@/lib/types'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [vgRes, devRes, genRes, platRes] = await Promise.all([
    supabase
      .from('videojuegos')
      .select(
        `
        *,
        desarrolladores(id, nombre),
        videojuegos_generos(generos(id, nombre)),
        videojuegos_plataformas(plataformas(id, nombre))
      `
      )
      .eq('id', parseInt(id))
      .single(),
    supabase.from('desarrolladores').select('*').order('nombre'),
    supabase.from('generos').select('*').order('nombre'),
    supabase.from('plataformas').select('*').order('nombre'),
  ])

  if (!vgRes.data) notFound()

  return (
    <>
      <h1 className="mb-8 font-mono text-2xl font-bold uppercase tracking-widest text-text-primary">
        Edit: {vgRes.data.titulo}
      </h1>
      <VideogameForm
        desarrolladores={devRes.data ?? []}
        generos={genRes.data ?? []}
        plataformas={platRes.data ?? []}
        defaultValues={vgRes.data as Videojuego}
        action={updateVideojuego}
      />
    </>
  )
}

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function InlineAddField({ tabla, onAdded }) {
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleAdd() {
    if (!nombre.trim()) return
    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from(tabla)
      .insert({ nombre: nombre.trim() })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
    } else {
      onAdded(data)
      setNombre('')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        placeholder={`Agregar ${tabla.slice(0, -1)}...`}
        className="flex-1 bg-surface border border-border-custom text-text-primary rounded px-2 py-1 text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading || !nombre.trim()}
        className="text-sm bg-olive-dark text-olive-mist px-3 py-1 rounded hover:bg-olive disabled:opacity-40 transition-colors"
      >
        {loading ? '...' : '+'}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

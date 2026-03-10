'use client'

// Delete button with browser confirm dialog. Uses a client-side wrapper
// because deleteVideojuego returns { error } instead of void, which is
// incompatible with the native form `action` attribute type.
import { deleteVideojuego } from '@/app/actions'
import { useState } from 'react'

export function DeleteButton({
  videojuegoId,
  titulo,
}: {
  videojuegoId: number
  titulo: string
}) {
  const [error, setError] = useState<string | null>(null)

  async function handleAction(formData: FormData) {
    if (!window.confirm(`Are you sure you want to delete "${titulo}"?`)) {
      return
    }
    const result = await deleteVideojuego(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-1 text-xs text-danger">{error}</p>
      )}
      <form action={handleAction}>
        <input type="hidden" name="id" value={videojuegoId} />
        <button
          type="submit"
          className="rounded border border-border-custom px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-muted transition-colors hover:border-danger hover:text-danger"
        >
          Delete
        </button>
      </form>
    </div>
  )
}

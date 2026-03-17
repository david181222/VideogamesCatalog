import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useGameFilters } from '../../hooks/useGameFilters'
import GameFilters from '../../components/GameFilters'
import ConfirmModal from '../../components/ConfirmModal'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

export default function AdminDashboard() {
  const { games, loading, error: fetchError, filterProps, refetch } = useGameFilters({ paginate: false })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  async function handleDelete(id) {
    setDeleteError(null)

    // Orden estricto: videojuegos_generos → videojuegos_plataformas → videojuegos
    const { error: errGeneros } = await supabase
      .from('videojuegos_generos')
      .delete()
      .eq('videojuego_id', id)
    if (errGeneros) { setDeleteError(errGeneros.message); setDeleteTarget(null); return }

    const { error: errPlataformas } = await supabase
      .from('videojuegos_plataformas')
      .delete()
      .eq('videojuego_id', id)
    if (errPlataformas) { setDeleteError(errPlataformas.message); setDeleteTarget(null); return }

    const { error: errDelete } = await supabase
      .from('videojuegos')
      .delete()
      .eq('id', id)
    if (errDelete) { setDeleteError(errDelete.message); setDeleteTarget(null); return }

    setDeleteTarget(null)
    refetch()
  }

  const error = fetchError || deleteError

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-wide">
          Panel de Administración
        </h1>
        <Link
          to="/admin/new"
          className="bg-accent text-ink px-4 py-2 rounded font-semibold hover:bg-accent-muted transition-colors text-sm"
        >
          + Nuevo Videojuego
        </Link>
      </div>

      {/* Mismos filtros que el catálogo de usuario */}
      <GameFilters {...filterProps} />

      <ErrorMessage error={error} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : games.length === 0 ? (
        <p className="text-center text-text-muted py-16">No hay videojuegos que coincidan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full surface-card rounded-lg text-sm">
            <thead>
              <tr className="bg-surface border-b border-border-custom">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Título</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Desarrollador</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden sm:table-cell">Año</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden sm:table-cell">Punt.</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {games.map((game) => (
                <tr key={game.id} className="hover:bg-olive-darkest/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{game.titulo}</td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                    {game.desarrolladores?.nombre || '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{game.anio}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {game.puntuacion !== null && game.puntuacion !== undefined ? (
                      <span className="text-accent score-glow font-bold">{game.puntuacion}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link
                      to={`/admin/edit/${game.id}`}
                      className="text-accent hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(game)}
                      className="text-danger hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`¿Eliminar "${deleteTarget.titulo}"? Esta acción no se puede deshacer.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

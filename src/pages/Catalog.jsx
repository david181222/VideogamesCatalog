import { useGameFilters } from '../hooks/useGameFilters'
import GameCard from '../components/GameCard'
import GameFilters from '../components/GameFilters'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'

function getPageNumbers(page, totalPages) {
  const delta = 2
  const pages = []
  const start = Math.max(0, page - delta)
  const end = Math.min(totalPages - 1, page + delta)

  if (start > 0) {
    pages.push(0)
    if (start > 1) pages.push('...')
  }
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) {
    if (end < totalPages - 2) pages.push('...')
    pages.push(totalPages - 1)
  }
  return pages
}

export default function Catalog() {
  const { games, loading, error, filterProps, page, setPage, totalCount, pageSize } = useGameFilters()
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-text-primary mb-6 tracking-wide">
        Videogames Catalog
      </h1>

      <GameFilters {...filterProps} />

      <ErrorMessage error={error} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : games.length === 0 ? (
        <p className="text-center text-text-muted py-16">No se encontraron videojuegos.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 mt-8 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded text-sm bg-surface border border-border-custom text-text-secondary hover:text-text-primary hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ←
              </button>

              {getPageNumbers(page, totalPages).map((item, i) =>
                item === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-text-muted text-sm select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                      item === page
                        ? 'bg-accent text-ink border-accent font-semibold'
                        : 'bg-surface border-border-custom text-text-secondary hover:text-text-primary hover:border-accent'
                    }`}
                  >
                    {item + 1}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1.5 rounded text-sm bg-surface border border-border-custom text-text-secondary hover:text-text-primary hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

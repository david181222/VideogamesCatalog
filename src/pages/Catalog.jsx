import { useGameFilters } from '../hooks/useGameFilters'
import GameCard from '../components/GameCard'
import GameFilters from '../components/GameFilters'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'

export default function Catalog() {
  const { games, loading, error, filterProps } = useGameFilters()

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
        <p className="text-center text-text-muted py-16">No se encontraron videjuegos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}

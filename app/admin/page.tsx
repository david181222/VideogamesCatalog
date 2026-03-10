import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchFilterOptions, fetchVideojuegos } from '@/lib/queries'
import { DeleteButton } from '@/components/delete-button'
import { SearchBar } from '@/components/search-bar'
import { FilterBar } from '@/components/filter-bar'
import { Pagination } from '@/components/pagination'
import type { CatalogSearchParams } from '@/lib/types'

const PAGE_SIZE = 20

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ generos, plataformas, anios }, { videojuegos, count, totalPages, currentPage, error }] =
    await Promise.all([
      fetchFilterOptions(supabase),
      fetchVideojuegos(supabase, params, PAGE_SIZE),
    ])

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold uppercase tracking-widest text-text-primary">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage the videogame catalog. {count} titles found.
          </p>
        </div>
        <Link
          href="/admin/create"
          className="rounded border border-olive-dark bg-olive-dark px-5 py-2.5 font-mono text-sm uppercase tracking-wider text-text-primary transition-colors hover:bg-olive"
        >
          + New Game
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <SearchBar />
        <FilterBar generos={generos} plataformas={plataformas} anios={anios} showSort />
      </div>

      {error && (
        <p className="mb-4 text-sm text-danger">
          Error loading data: {error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded border border-border-custom">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-custom bg-surface">
            <tr>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                Title
              </th>
              <th className="hidden px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted sm:table-cell">
                Year
              </th>
              <th className="hidden px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted md:table-cell">
                Developer
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                Score
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-custom">
            {videojuegos.map((v) => (
              <tr
                key={v.id}
                className="bg-surface-elevated transition-colors hover:bg-surface"
              >
                <td className="px-4 py-3 font-medium text-text-primary">
                  {v.titulo}
                </td>
                <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">
                  {v.anio}
                </td>
                <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
                  {v.desarrolladores?.nombre ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {v.puntuacion !== null ? (
                    <span
                      className={`font-mono font-bold ${
                        v.puntuacion >= 75
                          ? 'text-accent'
                          : v.puntuacion >= 50
                            ? 'text-warning'
                            : 'text-danger'
                      }`}
                    >
                      {v.puntuacion}
                    </span>
                  ) : (
                    <span className="text-text-muted">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/edit/${v.id}`}
                      className="rounded border border-border-custom px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-muted transition-colors hover:border-olive-dark hover:text-olive-light"
                    >
                      Edit
                    </Link>
                    <DeleteButton videojuegoId={v.id} titulo={v.titulo} />
                  </div>
                </td>
              </tr>
            ))}
            {videojuegos.length === 0 && !error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-text-muted"
                >
                  No games found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  )
}

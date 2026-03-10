// Sticky top navigation bar. isAdmin is computed server-side in the layout
// and passed as a prop to avoid exposing admin links to regular users.
import Link from 'next/link'
import { signOut } from '@/app/actions'

export function Navbar({
  userEmail,
  isAdmin,
}: {
  userEmail: string | null
  isAdmin: boolean
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border-custom bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold uppercase tracking-widest text-accent">
              VG//Catalog
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-4 sm:flex">
            <Link
              href="/"
              className="font-mono text-sm uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
            >
              Catalog
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="font-mono text-sm uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden text-sm text-text-muted sm:block">
              {userEmail}
            </span>
          )}
          {/* Sign Out triggers a Server Action directly inside a form */}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded border border-border-custom bg-surface-elevated px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-secondary transition-colors hover:border-danger hover:text-danger"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Mobile nav — shown as a second row on small screens */}
      <div className="flex items-center gap-4 border-t border-border-custom px-4 py-2 sm:hidden">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
        >
          Catalog
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="font-mono text-xs uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
          >
            Admin
          </Link>
        )}
        {userEmail && (
          <span className="ml-auto text-xs text-text-muted truncate max-w-32">
            {userEmail}
          </span>
        )}
      </div>
    </nav>
  )
}

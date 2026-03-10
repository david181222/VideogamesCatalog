import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
      <div className="text-center">
        <h1 className="font-mono text-6xl font-bold text-accent score-glow">
          404
        </h1>
        <p className="mt-4 font-mono text-lg uppercase tracking-widest text-text-secondary">
          Target not found
        </p>
        <p className="mt-2 text-sm text-text-muted">
          The requested resource does not exist in this sector.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded border border-olive-dark bg-olive-dark px-6 py-3 font-mono text-sm uppercase tracking-wider text-text-primary transition-colors hover:bg-olive"
        >
          Return to Base
        </Link>
      </div>
    </div>
  )
}

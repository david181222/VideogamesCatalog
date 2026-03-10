'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
      <div className="text-center">
        <h1 className="font-mono text-4xl font-bold uppercase tracking-widest text-danger">
          System Error
        </h1>
        <p className="mt-4 text-sm text-text-secondary">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="mt-8 rounded border border-olive-dark bg-olive-dark px-6 py-3 font-mono text-sm uppercase tracking-wider text-text-primary transition-colors hover:bg-olive"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

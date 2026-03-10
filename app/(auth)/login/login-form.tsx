'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions'
import Link from 'next/link'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, { error: null })

  const inputClasses =
    'w-full rounded border border-border-custom bg-surface px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-olive focus:outline-none'

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-text-secondary"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputClasses}
          placeholder="operator@foxhound.net"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-text-secondary"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className={inputClasses}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded border border-olive-dark bg-olive-dark px-6 py-3 font-mono text-sm uppercase tracking-widest text-text-primary transition-colors hover:bg-olive disabled:opacity-50"
      >
        {pending ? 'Authenticating...' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-text-muted">
        No account?{' '}
        <Link
          href="/register"
          className="text-olive-light transition-colors hover:text-accent"
        >
          Register
        </Link>
      </p>
    </form>
  )
}

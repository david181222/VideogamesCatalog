import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="rounded border border-border-custom bg-surface-elevated p-8">
      <div className="mb-8 text-center">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-widest text-accent">
          Tactical Access
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Authenticate to access Outer Heaven
        </p>
      </div>
      <LoginForm />
    </div>
  )
}

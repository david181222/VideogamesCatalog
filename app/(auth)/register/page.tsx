import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <div className="rounded border border-border-custom bg-surface-elevated p-8">
      <div className="mb-8 text-center">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-widest text-accent">
          New Recruit
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Create your account to join the operation
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}

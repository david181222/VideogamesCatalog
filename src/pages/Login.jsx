import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuthForm } from '../hooks/useAuthForm'
import Input from '../components/Input'
import Button from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'

export default function Login() {
  const navigate = useNavigate()
  const { email, setEmail, password, setPassword, error, loading, handleSubmit } =
    useAuthForm(
      ({ email, password }) => supabase.auth.signInWithPassword({ email, password }),
      () => navigate('/catalog')
    )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 grid-pattern">
      <div className="w-full max-w-md surface-card rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center text-text-primary mb-2 tracking-wide">
          Iniciar Sesión
        </h1>
        <p className="text-center text-text-muted text-sm mb-6">Ingresa a tu cuenta</p>

        <ErrorMessage error={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="BigBoss@outerheaven.com"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <Button type="submit" disabled={loading} className="w-full py-2">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          ¿Sin cuenta?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

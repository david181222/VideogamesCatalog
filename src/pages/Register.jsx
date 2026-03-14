import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuthForm } from '../hooks/useAuthForm'
import Input from '../components/Input'
import Button from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'

export default function Register() {
  const navigate = useNavigate()
  const { email, setEmail, password, setPassword, error, loading, handleSubmit } =
    useAuthForm(
      ({ email, password }) => supabase.auth.signUp({ email, password }),
      () => navigate('/catalog')
    )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 grid-pattern">
      <div className="w-full max-w-md surface-card rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center text-text-primary mb-2 tracking-wide">
          Kept you waiting, huh?
        </h1>
        <p className="text-center text-text-muted text-sm mb-6">Snake eater</p>

        <ErrorMessage error={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Ocelot@foxhound.com"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
          />
          <Button type="submit" disabled={loading} className="w-full py-2">
            {loading ? 'Commencing mission...' : 'Registrarse'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

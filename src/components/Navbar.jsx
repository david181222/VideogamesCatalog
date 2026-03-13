import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import Button from './Button'

export default function Navbar() {
  const { session, role } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-surface border-b border-border-custom px-4 py-3 flex items-center justify-between">
      <Link to="/catalog" className="text-xl font-bold text-accent tracking-wide">
        Mother Base
      </Link>

      <div className="flex items-center gap-4">
        {session ? (
          <>
            {role === 'admin' && (
              <Link
                to="/admin"
                className="text-sm text-text-secondary hover:text-accent transition-colors"
              >
                Boss
              </Link>
            )}
            <Link
              to="/catalog"
              className="text-sm text-text-secondary hover:text-accent transition-colors hidden sm:inline"
            >
              Catálogo
            </Link>
            <span className="text-sm text-text-muted hidden md:inline">
              {session.user.email}
            </span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Defect
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-text-secondary hover:text-accent transition-colors">
              Alistarse
            </Link>
            <Link
              to="/register"
              className="text-sm bg-accent text-ink px-3 py-1 rounded font-medium hover:bg-accent-muted transition-colors"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

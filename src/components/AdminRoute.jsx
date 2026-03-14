import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from './Spinner'

export default function AdminRoute({ children }) {
  const { session, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (role !== 'admin') return <Navigate to="/catalog" replace />

  return children
}

import { useState } from 'react'

export function useAuthForm(authFn, onSuccess) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await authFn({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onSuccess()
  }

  return { email, setEmail, password, setPassword, error, loading, handleSubmit }
}

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

    const { error } = await authFn({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    onSuccess()
  }

  return { email, setEmail, password, setPassword, error, loading, handleSubmit }
}

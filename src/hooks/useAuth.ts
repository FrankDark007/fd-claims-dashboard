import { useState, useCallback, useEffect } from 'react'

const TOKEN_KEY = 'fd-claims-token'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!token

  const login = useCallback(async (password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Wrong password')
        return false
      }
      const data = await res.json()
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      return true
    } catch {
      setError('Connection error')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const googleLogin = useCallback(async (credential: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Google sign-in failed')
        return false
      }
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      return true
    } catch {
      setError('Connection error')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  // Verify token is still valid on mount
  useEffect(() => {
    if (!token) return
    fetch('/api/claims', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.status === 401) {
        logout()
      }
    }).catch(() => {})
  }, [token, logout])

  return { isAuthenticated, token, login, googleLogin, logout, loading, error }
}

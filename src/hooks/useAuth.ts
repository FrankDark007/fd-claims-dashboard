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
    }).catch(() => {
      // Network error — don't logout, might be offline
    })
  }, [token, logout])

  return { isAuthenticated, token, login, logout, loading, error }
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

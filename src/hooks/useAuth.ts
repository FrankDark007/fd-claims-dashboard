import { useState, useCallback, useEffect } from 'react'
import type { User } from '../types/claim'

const TOKEN_KEY = 'fd-claims-token'
const USER_KEY = 'fd-claims-user'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(() => !!localStorage.getItem(TOKEN_KEY))
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!token && !!user

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        return false
      }
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
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
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
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
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Verify token is still valid on mount
  useEffect(() => {
    if (!token) {
      setInitializing(false)
      return
    }

    let cancelled = false

    const restoreSession = async () => {
      try {
        const res = await fetch('/api/session', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (cancelled) {
          return
        }

        if (res.status === 401) {
          logout()
          return
        }

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        const data = await res.json() as { user: User }
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        setUser(data.user)
      } catch {
        logout()
      } finally {
        if (!cancelled) {
          setInitializing(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [token, logout])

  return { isAuthenticated, token, user, login, googleLogin, logout, loading, error, initializing }
}

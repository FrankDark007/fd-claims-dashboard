import { useState, useEffect, useCallback } from 'react'
import type { Claim, DashboardStats } from '../types/claim'

export function useClaims(token: string) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/claims', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setClaims(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  return { claims, loading, error, refetch: fetchClaims }
}

export function computeStats(claims: Claim[]): DashboardStats {
  return {
    totalClaims: claims.length,
    totalRevenue: claims.reduce((sum, c) => sum + (c.amount || 0), 0),
    overdueCount: claims.filter((c) => c.status === 'Overdue').length,
    activeCount: claims.filter((c) => !c.done && c.status !== 'Paid').length,
    missingContracts: claims.filter((c) => c.contract === 'Missing').length,
    missingCOCs: claims.filter((c) => c.coc === 'Missing').length,
  }
}

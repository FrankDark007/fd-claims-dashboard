import { useState, useEffect, useCallback } from 'react'
import type { Claim, DashboardStats, InvoiceAgingBucket } from '../types/claim'

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

export function computeAging(claims: Claim[]): InvoiceAgingBucket[] {
  const now = Date.now()
  const sentClaims = claims.filter(c => c.status === 'Sent' && c.dateAdded)

  const buckets: InvoiceAgingBucket[] = [
    { label: 'Current', range: '0-30 days', count: 0, totalAmount: 0, color: 'text-aging-current bg-green-50', projects: [] },
    { label: 'Warning', range: '31-60 days', count: 0, totalAmount: 0, color: 'text-aging-warning bg-yellow-50', projects: [] },
    { label: 'Late', range: '61-90 days', count: 0, totalAmount: 0, color: 'text-aging-late bg-orange-50', projects: [] },
    { label: 'Critical', range: '90+ days', count: 0, totalAmount: 0, color: 'text-aging-critical bg-red-50', projects: [] },
  ]

  for (const claim of sentClaims) {
    const days = Math.floor((now - new Date(claim.dateAdded!).getTime()) / 86400000)
    const idx = days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : 3
    buckets[idx].count++
    buckets[idx].totalAmount += claim.amount || 0
    buckets[idx].projects.push(claim)
  }

  return buckets
}

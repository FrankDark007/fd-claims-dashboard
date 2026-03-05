import { useState, useEffect, useCallback } from 'react'

export interface InvoiceEventWithProject {
  id: string
  projectId: string
  type: 'sent' | 'reminder' | 'paid' | 'disputed'
  date: string
  amount: number
  notes: string
  createdBy: string
}

export function useInvoiceEvents(token: string) {
  const [events, setEvents] = useState<InvoiceEventWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invoice-events', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json() as { events: InvoiceEventWithProject[] }
      setEvents(data.events)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice events')
    } finally {
      setLoading(false)
    }
  }, [token])

  const addEvent = useCallback(async (params: {
    projectId: string
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    notes?: string
  }) => {
    const res = await fetch('/api/invoice-events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add event' }))
      throw new Error((err as { error: string }).error)
    }

    const data = await res.json() as { event: InvoiceEventWithProject }
    setEvents(prev => [data.event, ...prev])
    return data.event
  }, [token])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, addEvent, refetch: fetchEvents }
}

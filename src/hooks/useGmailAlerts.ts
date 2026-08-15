import { useCallback, useEffect, useRef, useState } from 'react'

export interface GmailAlert {
  id: string
  projectId: string
  communicationId: string
  gmailMessageId: string
  gmailThreadId: string | null
  fromAddress: string
  fromName: string
  subject: string
  summary: string
  urgency: number
  matchScore: number
  matchRole: string
  read: boolean
  createdAt: string
  clientName?: string
  projectName?: string
}

const POLL_INTERVAL = 60_000 // 60 seconds

export function useGmailAlerts(token: string, opts: { unreadOnly?: boolean } = {}) {
  const [alerts, setAlerts] = useState<GmailAlert[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (opts.unreadOnly) params.set('unread', '1')
      params.set('limit', '50')

      const res = await fetch(`/api/gmail/alerts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) return

      const json = await res.json() as { alerts: GmailAlert[] }
      setAlerts(json.alerts)
    } catch {
      // Silently fail on poll errors
    } finally {
      setLoading(false)
    }
  }, [token, opts.unreadOnly])

  const markAsRead = useCallback(async (alertIds: string[]) => {
    if (alertIds.length === 0) return false

    try {
      const response = await fetch('/api/gmail/alerts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertIds }),
      })

      if (!response.ok) return false

      setAlerts((prev) => prev.map((a) =>
        alertIds.includes(a.id) ? { ...a, read: true } : a,
      ))
      return true
    } catch {
      return false
    }
  }, [token])

  useEffect(() => {
    fetchAlerts()
    intervalRef.current = setInterval(fetchAlerts, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchAlerts])

  const unreadCount = alerts.filter((a) => !a.read).length

  return { alerts, unreadCount, loading, markAsRead, refresh: fetchAlerts }
}

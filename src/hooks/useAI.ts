import { useCallback, useState } from 'react'

interface BriefingItem {
  priority: number
  action: string
  reason: string
  projectId: string | null
}

interface BriefingResponse {
  items: BriefingItem[]
  generatedAt: string
  cached: boolean
  stats: {
    totalProjects: number
    activeProjects: number
    unpaidProjects: number
  }
}

interface ProjectSummary {
  status: string
  risks: string[]
  nextAction: string
  communicationSummary: string
}

interface DraftEmailResponse {
  subject: string
  body: string
  to: string
}

export function useAiBriefing(token: string) {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBriefing = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const url = forceRefresh ? '/api/ai/briefing?refresh=1' : '/api/ai/briefing'
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch briefing' }))
        throw new Error((err as { error?: string }).error || `API error: ${res.status}`)
      }

      const data = await res.json() as BriefingResponse
      setBriefing(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load briefing')
    } finally {
      setLoading(false)
    }
  }, [token])

  return { briefing, loading, error, fetchBriefing }
}

export function useAiProjectSummary(token: string) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async (projectId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai/project-summary/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch summary' }))
        throw new Error((err as { error?: string }).error || `API error: ${res.status}`)
      }

      const data = await res.json() as { summary: ProjectSummary }
      setSummary(data.summary)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }, [token])

  return { summary, loading, error, fetchSummary }
}

export function useAiDraftEmail(token: string) {
  const [draft, setDraft] = useState<DraftEmailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateDraft = useCallback(async (
    projectId: string,
    templateType: 'reminder' | 'document_request' | 'escalation' | 'payment_confirmation',
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, templateType }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to generate draft' }))
        throw new Error((err as { error?: string }).error || `API error: ${res.status}`)
      }

      const data = await res.json() as DraftEmailResponse
      setDraft(data)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate draft'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  return { draft, loading, error, generateDraft }
}

export function useAiSendEmail(token: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendEmail = useCallback(async (input: {
    projectId: string
    to: string
    subject: string
    body: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/send-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to send email' }))
        throw new Error((err as { error?: string }).error || `API error: ${res.status}`)
      }

      const data = await res.json() as { success: boolean; emailId: string; communicationId: string }
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send email'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  return { loading, error, sendEmail }
}

import { useState, useEffect, useCallback } from 'react'

interface ProjectData {
  files: ProjectFile[]
  emails: ProjectEmail[]
  invoiceEvents: InvoiceEvent[]
}

export interface ProjectFile {
  id: string
  name: string
  r2Key: string
  category: 'contracts' | 'cocs' | 'photos' | 'other'
  size: number
  mimeType: string
  uploadedAt: string
  uploadedBy: string
}

export interface ProjectEmail {
  id: string
  gmailMessageId: string
  threadId: string
  from: string
  to: string
  subject: string
  body: string
  date: string
  direction: 'inbound' | 'outbound'
}

export interface InvoiceEvent {
  id: string
  type: 'sent' | 'reminder' | 'paid' | 'disputed'
  date: string
  amount: number
  notes: string
  createdBy: string
}

export function useProjectData(projectId: string | undefined, token: string) {
  const [data, setData] = useState<ProjectData>({ files: [], emails: [], invoiceEvents: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/data`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load project data')
    } finally {
      setLoading(false)
    }
  }, [projectId, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

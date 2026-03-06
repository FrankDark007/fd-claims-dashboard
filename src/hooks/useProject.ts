import { useState, useEffect, useCallback } from 'react'
import type { InvoiceEvent, Project, ProjectDataResponse, ProjectEmail, ProjectFile, ProjectWriteInput } from '../shared/projects'

export type { InvoiceEvent, ProjectEmail, ProjectFile }

export function useProject(projectId: string | undefined, token: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const json = await res.json() as { project: Project }
      setProject(json.project)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId, token])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const saveProject = useCallback(async (input: ProjectWriteInput) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update project' }))
      throw new Error((err as { error?: string }).error || 'Failed to update project')
    }

    const json = await res.json() as { project: Project }
    setProject(json.project)
    setError(null)
    return json.project
  }, [projectId, token])

  return { project, loading, error, refetch: fetchProject, saveProject }
}

export function useProjectData(projectId: string | undefined, token: string) {
  const [data, setData] = useState<ProjectDataResponse>({ files: [], emails: [], invoiceEvents: [] })
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
      const json = await res.json() as ProjectDataResponse
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

  const addInvoiceEvent = useCallback(async (input: {
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    notes?: string
    recipient?: string
  }) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}/invoice-tracking`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create invoice event' }))
      throw new Error((err as { error?: string }).error || 'Failed to create invoice event')
    }

    const json = await res.json() as { event: InvoiceEvent }
    setData((current) => ({
      ...current,
      invoiceEvents: [json.event, ...current.invoiceEvents].sort(sortInvoiceEvents),
    }))
    setError(null)
    return json.event
  }, [projectId, token])

  const updateInvoiceEvent = useCallback(async (eventId: string, input: {
    type?: 'sent' | 'reminder' | 'paid' | 'disputed'
    date?: string
    amount?: number
    notes?: string
    recipient?: string
  }) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/invoice-events/${projectId}/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update invoice event' }))
      throw new Error((err as { error?: string }).error || 'Failed to update invoice event')
    }

    const json = await res.json() as { event: InvoiceEvent }
    setData((current) => ({
      ...current,
      invoiceEvents: current.invoiceEvents
        .map((event) => event.id === eventId ? json.event : event)
        .sort(sortInvoiceEvents),
    }))
    setError(null)
    return json.event
  }, [projectId, token])

  const removeInvoiceEvent = useCallback(async (eventId: string) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/invoice-events/${projectId}/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete invoice event' }))
      throw new Error((err as { error?: string }).error || 'Failed to delete invoice event')
    }

    setData((current) => ({
      ...current,
      invoiceEvents: current.invoiceEvents.filter((event) => event.id !== eventId),
    }))
    setError(null)
  }, [projectId, token])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    addInvoiceEvent,
    updateInvoiceEvent,
    removeInvoiceEvent,
  }
}

function sortInvoiceEvents(a: InvoiceEvent, b: InvoiceEvent) {
  const dateDiff = new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  if (dateDiff !== 0) {
    return dateDiff
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

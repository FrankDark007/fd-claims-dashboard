import { useState, useEffect, useCallback } from 'react'
import type { InvoiceEvent, Project, ProjectDataResponse, ProjectEmail, ProjectFile } from '../shared/projects'

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

  return { project, loading, error, refetch: fetchProject }
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

  return { data, loading, error, refetch: fetchData }
}
